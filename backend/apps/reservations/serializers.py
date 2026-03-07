from rest_framework import serializers
from .models import Reservation
from apps.venues.serializers import VenueListSerializer
from apps.users.serializers import UserSerializer


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'venue', 'reservation_type', 'date', 'time',
            'party_size', 'special_requests', 'deposit_amount'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReservationSerializer(serializers.ModelSerializer):
    venue = VenueListSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'reference', 'user', 'venue', 'reservation_type', 'status',
            'date', 'time', 'party_size', 'table_number', 'special_requests',
            'rejection_reason', 'deposit_amount', 'is_deposit_paid',
            'created_at', 'updated_at', 'confirmed_at'
        ]
        read_only_fields = [
            'id', 'reference', 'user', 'status', 'created_at',
            'updated_at', 'confirmed_at'
        ]


class ReservationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['status', 'rejection_reason', 'table_number']

    def validate_status(self, value):
        allowed = [Reservation.STATUS_ACCEPTED, Reservation.STATUS_REJECTED, Reservation.STATUS_COMPLETED]
        if value not in allowed:
            raise serializers.ValidationError(f'Status must be one of: {allowed}')
        return value
