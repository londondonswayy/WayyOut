from django.contrib import admin
from .models import Venue, Category, VenuePhoto, OpeningHours, VenueAvailability, VenueReview


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


class VenuePhotoInline(admin.TabularInline):
    model = VenuePhoto
    extra = 1


class OpeningHoursInline(admin.TabularInline):
    model = OpeningHours
    extra = 7


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'category', 'status', 'is_open', 'rating', 'busy_level']
    list_filter = ['status', 'is_open', 'is_featured', 'category']
    search_fields = ['name', 'city', 'address']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VenuePhotoInline, OpeningHoursInline]
    actions = ['approve_venues', 'reject_venues']

    def approve_venues(self, request, queryset):
        queryset.update(status=Venue.STATUS_APPROVED)
    approve_venues.short_description = 'Approve selected venues'

    def reject_venues(self, request, queryset):
        queryset.update(status=Venue.STATUS_REJECTED)
    reject_venues.short_description = 'Reject selected venues'


@admin.register(VenueReview)
class VenueReviewAdmin(admin.ModelAdmin):
    list_display = ['venue', 'user', 'rating', 'created_at']
    list_filter = ['rating']
