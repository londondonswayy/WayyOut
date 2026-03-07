from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, F, FloatField, ExpressionWrapper
from django.db.models.functions import Radians, Power, Sin, Cos, ATan2, Sqrt
import math
from .models import Venue, Category, VenuePhoto, OpeningHours, VenueAvailability, VenueReview
from .serializers import (
    VenueListSerializer, VenueDetailSerializer, VenueCreateUpdateSerializer,
    CategorySerializer, VenuePhotoSerializer, OpeningHoursSerializer,
    VenueAvailabilitySerializer, VenueReviewSerializer
)


class IsVenueOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user or request.user.is_staff


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class VenueListView(generics.ListAPIView):
    serializer_class = VenueListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'city', 'address']
    ordering_fields = ['rating', 'busy_level', 'created_at']

    def get_queryset(self):
        qs = Venue.objects.filter(status=Venue.STATUS_APPROVED)

        category = self.request.query_params.get('category')
        city = self.request.query_params.get('city')
        is_open = self.request.query_params.get('is_open')
        vibe = self.request.query_params.get('vibe')
        featured = self.request.query_params.get('featured')
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = float(self.request.query_params.get('radius', 10))  # km

        if category:
            qs = qs.filter(category__slug=category)
        if city:
            qs = qs.filter(city__icontains=city)
        if is_open is not None:
            qs = qs.filter(is_open=is_open.lower() == 'true')
        if vibe:
            qs = qs.filter(vibe=vibe)
        if featured:
            qs = qs.filter(is_featured=True)

        # Distance filtering using Haversine approximation
        if lat and lng:
            try:
                lat, lng = float(lat), float(lng)
                # Filter approximate bounding box first
                lat_delta = radius / 111.0
                lng_delta = radius / (111.0 * math.cos(math.radians(lat)))
                qs = qs.filter(
                    latitude__gte=lat - lat_delta,
                    latitude__lte=lat + lat_delta,
                    longitude__gte=lng - lng_delta,
                    longitude__lte=lng + lng_delta,
                )
            except ValueError:
                pass

        return qs.select_related('category').order_by('-is_featured', '-rating')


class VenueDetailView(generics.RetrieveAPIView):
    queryset = Venue.objects.filter(status=Venue.STATUS_APPROVED)
    serializer_class = VenueDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class VenueCreateView(generics.CreateAPIView):
    serializer_class = VenueCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class VenueUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = VenueCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsVenueOwnerOrAdmin]

    def get_queryset(self):
        return Venue.objects.filter(owner=self.request.user)


class MyVenuesView(generics.ListAPIView):
    serializer_class = VenueDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Venue.objects.filter(owner=self.request.user)


class VenueAvailabilityView(generics.ListCreateAPIView):
    serializer_class = VenueAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VenueAvailability.objects.filter(venue__slug=self.kwargs['slug'])

    def perform_create(self, serializer):
        venue = Venue.objects.get(slug=self.kwargs['slug'], owner=self.request.user)
        serializer.save(venue=venue)


class OpeningHoursView(generics.ListCreateAPIView):
    serializer_class = OpeningHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OpeningHours.objects.filter(venue__slug=self.kwargs['slug'])

    def perform_create(self, serializer):
        venue = Venue.objects.get(slug=self.kwargs['slug'], owner=self.request.user)
        serializer.save(venue=venue)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_venue_open(request, slug):
    venue = Venue.objects.get(slug=slug, owner=request.user)
    venue.is_open = not venue.is_open
    venue.save()
    return Response({'is_open': venue.is_open})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_busy_level(request, slug):
    venue = Venue.objects.get(slug=slug, owner=request.user)
    busy_level = request.data.get('busy_level', 0)
    venue.busy_level = max(0, min(100, int(busy_level)))
    venue.save()
    return Response({'busy_level': venue.busy_level})


class VenueReviewCreateView(generics.CreateAPIView):
    serializer_class = VenueReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        venue = Venue.objects.get(slug=self.kwargs['slug'])
        review = serializer.save(user=self.request.user, venue=venue)
        # Recalculate venue rating
        reviews = venue.reviews.all()
        venue.rating = sum(r.rating for r in reviews) / len(reviews)
        venue.review_count = len(reviews)
        venue.save()


class AdminVenueListView(generics.ListAPIView):
    serializer_class = VenueDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Venue.objects.all().order_by('-created_at')
    filterset_fields = ['status', 'city', 'category']
    search_fields = ['name', 'city']


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_venue(request, pk):
    venue = Venue.objects.get(pk=pk)
    venue.status = Venue.STATUS_APPROVED
    venue.save()
    return Response({'status': venue.status})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def reject_venue(request, pk):
    venue = Venue.objects.get(pk=pk)
    venue.status = Venue.STATUS_REJECTED
    venue.save()
    return Response({'status': venue.status})


class TrendingVenuesView(generics.ListAPIView):
    serializer_class = VenueListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Venue.objects.filter(
            status=Venue.STATUS_APPROVED,
            is_open=True
        ).order_by('-busy_level', '-rating')[:10]
