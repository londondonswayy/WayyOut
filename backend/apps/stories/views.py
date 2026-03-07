from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Story, StoryView, StoryRepost
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
