from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Story, StoryView, StoryRepost, StoryLike, StoryComment
from .serializers import StorySerializer, StoryCreateSerializer, StoryCommentSerializer


class StoryFeedView(generics.ListAPIView):
    serializer_class = StorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Story.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now()
        ).select_related('author', 'venue')

        city = self.request.query_params.get('city')
        venue_slug = self.request.query_params.get('venue')
        source = self.request.query_params.get('source')

        if city:
            qs = qs.filter(venue__city__icontains=city)
        if venue_slug:
            qs = qs.filter(venue__slug=venue_slug)
        if source:
            qs = qs.filter(source=source)

        return qs.order_by('-created_at')


class StoryCreateView(generics.CreateAPIView):
    serializer_class = StoryCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        story = serializer.save()
        return Response(StorySerializer(story, context={'request': request}).data, status=status.HTTP_201_CREATED)


class StoryDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Story.objects.filter(author=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def view_story(request, pk):
    story = Story.objects.get(pk=pk)
    _, created = StoryView.objects.get_or_create(story=story, viewer=request.user)
    if created:
        story.view_count += 1
        story.save(update_fields=['view_count'])
    return Response({'view_count': story.view_count})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def repost_story(request, pk):
    from apps.venues.models import Venue
    story = Story.objects.get(pk=pk)
    venue_id = request.data.get('venue_id')
    venue = Venue.objects.get(pk=venue_id, owner=request.user)
    repost, created = StoryRepost.objects.get_or_create(
        original=story, venue=venue,
        defaults={'reposted_by': request.user}
    )
    return Response({'reposted': created})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def like_story(request, pk):
    story = Story.objects.get(pk=pk)
    like, created = StoryLike.objects.get_or_create(story=story, user=request.user)
    if not created:
        like.delete()
        return Response({'liked': False, 'like_count': story.likes.count()})
    return Response({'liked': True, 'like_count': story.likes.count()}, status=201)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def story_comments(request, pk):
    story = Story.objects.get(pk=pk, is_active=True)
    if request.method == 'GET':
        comments = story.comments.select_related('author').order_by('created_at')
        return Response(StoryCommentSerializer(comments, many=True).data)

    # POST — add comment
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Comment cannot be empty.'}, status=400)
    if len(text) > 500:
        return Response({'error': 'Comment too long (max 500 chars).'}, status=400)
    comment = StoryComment.objects.create(story=story, author=request.user, text=text)
    return Response(StoryCommentSerializer(comment).data, status=201)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, pk, comment_id):
    comment = StoryComment.objects.get(pk=comment_id, story_id=pk, author=request.user)
    comment.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def share_to_friend(request, pk):
    """
    Sends a DM to a friend with a link to this post.
    Body: { friend_id: int }
    """
    from apps.users.models import User, Friendship, DirectMessage
    from django.db.models import Q

    story = Story.objects.get(pk=pk, is_active=True)
    friend_id = request.data.get('friend_id')
    if not friend_id:
        return Response({'error': 'friend_id required.'}, status=400)

    friend = User.objects.get(pk=friend_id)
    is_friend = Friendship.objects.filter(
        Q(from_user=request.user, to_user=friend) | Q(from_user=friend, to_user=request.user),
        status='accepted'
    ).exists()
    if not is_friend:
        return Response({'error': 'You must be friends to share.'}, status=403)

    venue_part = f" at {story.venue.name}" if story.venue else ""
    caption_part = f" — \"{story.caption}\"" if story.caption else ""
    msg_text = f"📸 {request.user.full_name} shared a post{venue_part}{caption_part}"

    DirectMessage.objects.create(sender=request.user, receiver=friend, content=msg_text)
    return Response({'sent': True})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def social_feed(request):
    """
    Social feed: only real venue posts and customer posts.
    No generated/fake activity. Sorted by recency with pagination.
    Supports ?page=N&city=X
    """
    page = int(request.query_params.get('page', 1))
    page_size = 12
    city = request.query_params.get('city', '')
    offset = (page - 1) * page_size

    # Stories: venue posts + customer posts only — no expiry filter for the feed
    qs = Story.objects.filter(is_active=True).select_related(
        'author', 'venue', 'venue__category'
    ).prefetch_related('likes', 'comments').order_by('-created_at')

    if city:
        from django.db.models import Q
        qs = qs.filter(
            Q(venue__city__icontains=city) | Q(author__city__icontains=city)
        )

    total = qs.count()
    stories = qs[offset: offset + page_size]

    results = []
    for story in stories:
        liked = False
        if request.user.is_authenticated:
            liked = story.likes.filter(user=request.user).exists()

        # Last 2 comments for preview
        preview = list(story.comments.order_by('-created_at')[:2])
        preview_data = [
            {'id': c.id, 'author_name': c.author.full_name, 'author_id': c.author_id, 'text': c.text, 'created_at': c.created_at.isoformat()}
            for c in reversed(preview)
        ]

        from apps.venues.serializers import VenueListSerializer
        results.append({
            'id': story.id,
            'type': 'post',
            'source': story.source,       # 'venue' or 'user'
            'created_at': story.created_at.isoformat(),
            'author': {
                'id': story.author.id,
                'full_name': story.author.full_name,
                'city': story.author.city,
                'role': story.author.role,
            },
            'venue': VenueListSerializer(story.venue).data if story.venue else None,
            'media': request.build_absolute_uri(story.media.url) if story.media else None,
            'media_type': story.media_type,
            'caption': story.caption,
            'vibe_tags': story.vibe_tags or [],
            'view_count': story.view_count,
            'like_count': story.likes.count(),
            'liked': liked,
            'comment_count': story.comments.count(),
            'preview_comments': preview_data,
        })

    return Response({
        'results': results,
        'page': page,
        'has_next': offset + page_size < total,
        'total': total,
    })


class AdminStoriesView(generics.ListAPIView):
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Story.objects.all().order_by('-created_at')
    filterset_fields = ['is_active', 'source', 'is_moderated']


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def moderate_story(request, pk):
    story = Story.objects.get(pk=pk)
    action = request.data.get('action')
    if action == 'remove':
        story.is_active = False
        story.is_moderated = True
        story.save()
    elif action == 'approve':
        story.is_moderated = True
        story.save()
    return Response({'status': 'done'})
