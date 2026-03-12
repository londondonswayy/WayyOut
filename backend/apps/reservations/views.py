from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Reservation
from .serializers import ReservationCreateSerializer, ReservationSerializer, ReservationStatusUpdateSerializer
from apps.venues.models import Venue


class ReservationCreateView(generics.CreateAPIView):
    serializer_class = ReservationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'reservation'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)


class UserReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Reservation.objects.filter(user=self.request.user)
        res_status = self.request.query_params.get('status')
        if res_status:
            qs = qs.filter(status=res_status)
        return qs.select_related('venue', 'user')


class ReservationDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        reservation = self.get_object()
        if reservation.status not in [Reservation.STATUS_PENDING, Reservation.STATUS_ACCEPTED]:
            return Response({'error': 'Cannot cancel this reservation.'}, status=status.HTTP_400_BAD_REQUEST)
        reservation.status = Reservation.STATUS_CANCELLED
        reservation.save()
        return Response({'message': 'Reservation cancelled.'})


class VenueReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        venue_slug = self.kwargs['slug']
        venue = Venue.objects.get(slug=venue_slug, owner=self.request.user)
        qs = Reservation.objects.filter(venue=venue)
        res_status = self.request.query_params.get('status')
        if res_status:
            qs = qs.filter(status=res_status)
        return qs.select_related('user', 'venue')


class UpdateReservationStatusView(generics.UpdateAPIView):
    serializer_class = ReservationStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(venue__owner=self.request.user)

    def update(self, request, *args, **kwargs):
        reservation = self.get_object()
        serializer = self.get_serializer(reservation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get('status')
        if new_status == Reservation.STATUS_ACCEPTED:
            reservation.confirmed_at = timezone.now()
        serializer.save()
        # Send notification (handled async in production)
        return Response(ReservationSerializer(reservation).data)


class AdminReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reservation.objects.all().select_related('user', 'venue').order_by('-created_at')
    filterset_fields = ['status', 'reservation_type']
    search_fields = ['reference', 'user__email', 'venue__name']
