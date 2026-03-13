from rest_framework import serializers
from .models import Venue, Category, VenuePhoto, OpeningHours, VenueAvailability, VenueReview, VenueAttendance
from apps.users.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'slug']


class VenuePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenuePhoto
        fields = ['id', 'image', 'caption', 'is_primary', 'order']


class OpeningHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = OpeningHours
        fields = ['id', 'day', 'day_name', 'open_time', 'close_time', 'is_closed']

    def get_day_name(self, obj):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[obj.day]


class VenueAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueAvailability
        fields = ['id', 'date', 'total_seats', 'available_seats', 'is_available', 'notes']


class VenueReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = VenueReview
        fields = ['id', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class VenueListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    distance = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'slug', 'category', 'address', 'city',
            'latitude', 'longitude', 'cover_image', 'logo',
            'is_open', 'busy_level', 'vibe', 'rating', 'review_count',
            'is_featured', 'distance', 'price_level'
        ]


class VenueDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    photos = VenuePhotoSerializer(many=True, read_only=True)
    opening_hours = OpeningHoursSerializer(many=True, read_only=True)
    reviews = VenueReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'slug', 'description', 'category', 'owner',
            'address', 'city', 'state', 'country', 'latitude', 'longitude',
            'phone', 'email', 'website', 'cover_image', 'logo',
            'status', 'is_open', 'is_featured', 'busy_level', 'vibe',
            'capacity', 'current_occupancy', 'rating', 'review_count',
            'commission_rate', 'price_level', 'photos', 'opening_hours', 'reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'status', 'rating', 'review_count', 'created_at', 'updated_at']


class VenueCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = [
            'name', 'description', 'category', 'address', 'city', 'state',
            'country', 'latitude', 'longitude', 'phone', 'email', 'website',
            'cover_image', 'logo', 'capacity', 'vibe'
        ]

    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        validated_data['owner'] = self.context['request'].user
        name = validated_data.get('name', '')
        validated_data['slug'] = f"{slugify(name)}-{uuid.uuid4().hex[:8]}"
        return super().create(validated_data)


class VenueAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueAttendance
        fields = ['id', 'venue', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']
