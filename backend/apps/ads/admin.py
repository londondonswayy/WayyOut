from django.contrib import admin
from .models import AdCampaign, AdImpression, AdFreeSubscription


@admin.register(AdCampaign)
class AdCampaignAdmin(admin.ModelAdmin):
    list_display = ['headline', 'venue', 'status', 'budget', 'spent', 'start_date', 'end_date']
    list_filter = ['status']
    search_fields = ['headline', 'venue__name']
    readonly_fields = ['spent', 'created_at', 'updated_at']


@admin.register(AdFreeSubscription)
class AdFreeSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'expires_at']
    list_filter = ['plan']


admin.site.register(AdImpression)
