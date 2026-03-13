from rest_framework import serializers
from .models import Story, StoryView, StoryRepost, StoryLike
from apps.users.serializers import UserSerializer
from apps.venues.serializers import VenueListSerializer
from django.utils import timezone


class StorySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    venue = VenueListSerializer(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    has_viewed = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'venue', 'author', 'source', 'media', 'thumbnail',
            'media_type', 'caption', 'vibe_tags', 'is_active',
            'view_count', 'like_count', 'liked', 'created_at', 'expires_at', 'is_expired', 'has_viewed'
        ]
        read_only_fields = ['id', 'author', 'view_count', 'created_at', 'expires_at']

    def get_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StoryView.objects.filter(story=obj, viewer=request.user).exists()
        return False

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StoryLike.objects.filter(story=obj, user=request.user).exists()
        return False


class StoryCreateSerializer(serializers.ModelSerializer):
    venue_id = serializers.IntegerField(required=False)

    class Meta:
        model = Story
        fields = ['venue_id', 'media', 'thumbnail', 'media_type', 'caption', 'vibe_tags', 'source']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        from apps.venues.models import Venue
        venue_id = validated_data.pop('venue_id', None)
        if venue_id:
            validated_data['venue'] = Venue.objects.get(pk=venue_id)
        return super().create(validated_data)
