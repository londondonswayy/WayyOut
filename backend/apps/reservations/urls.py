from django.urls import path
from .views import (
    ReservationCreateView, UserReservationsView, ReservationDetailView,
    VenueReservationsView, UpdateReservationStatusView, AdminReservationsView
)

urlpatterns = [
    path('', ReservationCreateView.as_view(), name='reservation-create'),
    path('my/', UserReservationsView.as_view(), name='my-reservations'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='reservation-detail'),
    path('venue/<slug:slug>/', VenueReservationsView.as_view(), name='venue-reservations'),
    path('<int:pk>/status/', UpdateReservationStatusView.as_view(), name='reservation-status'),
    path('admin/', AdminReservationsView.as_view(), name='admin-reservations'),
]
