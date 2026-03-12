from rest_framework import serializers
from .models import AdCampaign, AdImpression, AdFreeSubscription


class AdCampaignSerializer(serializers.ModelSerializer):
    impressions_count = serializers.IntegerField(read_only=True)
    budget_remaining = serializers.FloatField(read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = AdCampaign
        fields = [
            'id', 'venue', 'venue_name', 'headline', 'body', 'image', 'cta_text',
            'budget', 'spent', 'cost_per_impression', 'budget_remaining',
            'status', 'start_date', 'end_date', 'impressions_count', 'created_at',
        ]
        read_only_fields = ['spent', 'created_at']

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError('end_date must be after start_date')
        return data


class AdFeedSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_slug = serializers.CharField(source='venue.slug', read_only=True)
    venue_cover = serializers.SerializerMethodField()
    venue_city = serializers.CharField(source='venue.city', read_only=True)

    class Meta:
        model = AdCampaign
        fields = ['id', 'headline', 'body', 'image', 'cta_text', 'venue_name', 'venue_slug', 'venue_cover', 'venue_city']

    def get_venue_cover(self, obj):
        request = self.context.get('request')
        if obj.venue.cover_image and request:
            return request.build_absolute_uri(obj.venue.cover_image.url)
        return None


class AdFreeSubscriptionSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = AdFreeSubscription
        fields = ['id', 'plan', 'expires_at', 'is_active', 'created_at']
        read_only_fields = ['expires_at', 'created_at']
