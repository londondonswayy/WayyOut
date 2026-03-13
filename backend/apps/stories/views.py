from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Story, StoryView, StoryRepost, StoryLike
from .serializers import StorySerializer, StoryCreateSerializer


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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def social_feed(request):
    """
    Aggregated social feed combining stories, friend activity, reviews, and venue updates.
    Returns a list of feed items sorted by recency.
    Supports ?page=N&city=X query params.
    """
    from apps.venues.models import Venue, VenueReview, VenueAttendance
    from apps.users.models import Friendship
    from apps.venues.serializers import VenueListSerializer
    from django.db.models import Q
    import math

    page = int(request.query_params.get('page', 1))
    page_size = 10
    city = request.query_params.get('city', '')
    offset = (page - 1) * page_size

    # Determine friend IDs for the requesting user
    friend_ids = set()
    if request.user.is_authenticated:
        friendships = Friendship.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user),
            status='accepted'
        )
        for f in friendships:
            other = f.to_user if f.from_user == request.user else f.from_user
            friend_ids.add(other.id)

    feed_items = []

    # 1. STORIES — as feed posts (photos/videos)
    stories_qs = Story.objects.filter(
        is_active=True,
        expires_at__gt=timezone.now()
    ).select_related('author', 'venue', 'venue__category').order_by('-created_at')
    if city:
        stories_qs = stories_qs.filter(
            Q(venue__city__icontains=city) | Q(author__city__icontains=city)
        )

    for story in stories_qs[:40]:
        liked = False
        if request.user.is_authenticated:
            liked = StoryLike.objects.filter(story=story, user=request.user).exists()
        feed_items.append({
            'id': f'story_{story.id}',
            'type': 'story',
            'created_at': story.created_at.isoformat(),
            'author': {
                'id': story.author.id,
                'full_name': story.author.full_name,
                'city': story.author.city,
            },
            'venue': VenueListSerializer(story.venue).data if story.venue else None,
            'media': request.build_absolute_uri(story.media.url) if story.media else None,
            'media_type': story.media_type,
            'caption': story.caption,
            'vibe_tags': story.vibe_tags,
            'view_count': story.view_count,
            'like_count': story.likes.count(),
            'liked': liked,
            'story_id': story.id,
            'is_friend': story.author.id in friend_ids,
        })

    # 2. FRIEND ATTENDANCE — "Name is going to Venue tonight"
    attendance_qs = VenueAttendance.objects.filter(
        date=timezone.now().date()
    ).select_related('user', 'venue', 'venue__category').order_by('-created_at')
    if city:
        attendance_qs = attendance_qs.filter(venue__city__icontains=city)
    # Show own attendance + friends' attendance
    if request.user.is_authenticated:
        attendance_qs = attendance_qs.filter(
            Q(user__in=friend_ids) | Q(user=request.user)
        )
    else:
        attendance_qs = attendance_qs[:20]

    for att in attendance_qs[:20]:
        feed_items.append({
            'id': f'going_{att.id}',
            'type': 'going',
            'created_at': att.created_at.isoformat(),
            'author': {
                'id': att.user.id,
                'full_name': att.user.full_name,
                'city': att.user.city,
            },
            'venue': VenueListSerializer(att.venue).data,
            'text': f"{att.user.full_name.split()[0]} is going to {att.venue.name} tonight 🎉",
            'is_friend': att.user.id in friend_ids,
        })

    # 3. RECENT REVIEWS
    reviews_qs = VenueReview.objects.select_related('user', 'venue', 'venue__category').order_by('-created_at')
    if city:
        reviews_qs = reviews_qs.filter(venue__city__icontains=city)

    for rev in reviews_qs[:20]:
        stars = '⭐' * rev.rating
        feed_items.append({
            'id': f'review_{rev.id}',
            'type': 'review',
            'created_at': rev.created_at.isoformat(),
            'author': {
                'id': rev.user.id,
                'full_name': rev.user.full_name,
                'city': rev.user.city,
            },
            'venue': VenueListSerializer(rev.venue).data,
            'text': rev.comment,
            'rating': rev.rating,
            'stars': stars,
            'is_friend': rev.user.id in friend_ids,
        })

    # 4. VENUE OPENS / TRENDING UPDATES (non-personalized discovery)
    open_venues_qs = Venue.objects.filter(
        status=Venue.STATUS_APPROVED, is_open=True
    ).select_related('category').order_by('-busy_level', '-rating')
    if city:
        open_venues_qs = open_venues_qs.filter(city__icontains=city)

    from datetime import datetime, timezone as dt_tz
    for i, venue in enumerate(open_venues_qs[:10]):
        ts = (datetime.now(dt_tz.utc).replace(microsecond=0).isoformat())
        vibe_emoji = {'casual': '😎', 'lively': '🔥', 'romantic': '💕', 'upscale': '✨', 'party': '🎉'}.get(venue.vibe, '🏢')
        buzz_text = (
            f"🔥 Packed tonight" if venue.busy_level > 70 else
            f"🎵 Good energy" if venue.busy_level > 40 else
            f"😎 Chill vibes"
        )
        feed_items.append({
            'id': f'venue_{venue.id}_{i}',
            'type': 'venue_update',
            'created_at': ts,
            'venue': VenueListSerializer(venue).data,
            'text': f"{venue.name} is open now {vibe_emoji}",
            'subtext': buzz_text,
            'busy_level': venue.busy_level,
        })

    # Sort all items by created_at descending
    feed_items.sort(key=lambda x: x['created_at'], reverse=True)

    # Pagination
    total = len(feed_items)
    paginated = feed_items[offset: offset + page_size]
    has_next = offset + page_size < total

    return Response({
        'results': paginated,
        'page': page,
        'has_next': has_next,
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
