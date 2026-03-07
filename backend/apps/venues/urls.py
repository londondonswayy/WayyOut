from django.urls import path
from .views import (
    CategoryListView, VenueListView, VenueDetailView, VenueCreateView,
    VenueUpdateView, MyVenuesView, VenueAvailabilityView, OpeningHoursView,
    toggle_venue_open, update_busy_level, VenueReviewCreateView,
    AdminVenueListView, approve_venue, reject_venue, TrendingVenuesView
)

urlpatterns = [
    path('', VenueListView.as_view(), name='venue-list'),
    path('create/', VenueCreateView.as_view(), name='venue-create'),
    path('trending/', TrendingVenuesView.as_view(), name='venue-trending'),
    path('my/', MyVenuesView.as_view(), name='my-venues'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('<slug:slug>/', VenueDetailView.as_view(), name='venue-detail'),
    path('<slug:slug>/update/', VenueUpdateView.as_view(), name='venue-update'),
    path('<slug:slug>/toggle-open/', toggle_venue_open, name='toggle-venue-open'),
    path('<slug:slug>/busy-level/', update_busy_level, name='update-busy-level'),
    path('<slug:slug>/availability/', VenueAvailabilityView.as_view(), name='venue-availability'),
    path('<slug:slug>/hours/', OpeningHoursView.as_view(), name='opening-hours'),
    path('<slug:slug>/reviews/', VenueReviewCreateView.as_view(), name='venue-reviews'),

    # Admin
    path('admin/list/', AdminVenueListView.as_view(), name='admin-venue-list'),
    path('admin/<int:pk>/approve/', approve_venue, name='approve-venue'),
    path('admin/<int:pk>/reject/', reject_venue, name='reject-venue'),
]
