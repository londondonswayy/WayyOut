from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from .agent import get_ai_recommendations


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_discover(request):
    """
    AI-powered venue discovery endpoint.
    Body: { query, city, lat, lng }
    """
    query = request.data.get('query', '').strip()
    if not query:
        return Response({'error': 'Query is required.'}, status=status.HTTP_400_BAD_REQUEST)

    city = request.data.get('city')
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    result = get_ai_recommendations(query, city=city, lat=lat, lng=lng)
    return Response(result)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def ai_trending(request):
    """Returns trending venues and quick insights."""
    from apps.venues.models import Venue
    from apps.venues.serializers import VenueListSerializer

    city = request.query_params.get('city')
    qs = Venue.objects.filter(status=Venue.STATUS_APPROVED, is_open=True)
    if city:
        qs = qs.filter(city__icontains=city)

    trending = qs.order_by('-busy_level', '-rating')[:5]
    return Response({
        'trending': VenueListSerializer(trending, many=True).data,
        'insight': 'These spots are buzzing right now. Check live stories for the real vibe.'
    })
