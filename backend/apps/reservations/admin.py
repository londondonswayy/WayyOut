from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['reference', 'user', 'venue', 'date', 'time', 'party_size', 'status', 'created_at']
    list_filter = ['status', 'reservation_type', 'date']
    search_fields = ['reference', 'user__email', 'venue__name']
    readonly_fields = ['reference', 'created_at', 'updated_at', 'confirmed_at']
    ordering = ['-created_at']
