import re
from rest_framework import serializers
from django.utils import timezone
from .models import Reservation
from apps.venues.serializers import VenueListSerializer
from apps.users.serializers import UserSerializer

MAX_ACTIVE_RESERVATIONS = 5   # per user across all venues
MAX_PARTY_SIZE = 30
MAX_SPECIAL_REQUESTS_LEN = 500


def _sanitize(text):
    """Strip HTML tags and leading/trailing whitespace."""
    return re.sub(r'<[^>]+>', '', text).strip() if text else text


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'venue', 'reservation_type', 'date', 'time',
            'party_size', 'special_requests',
        ]

    # ── Field-level validation ─────────────────────────────

    def validate_party_size(self, value):
        if value < 1:
            raise serializers.ValidationError('Party size must be at least 1.')
        if value > MAX_PARTY_SIZE:
            raise serializers.ValidationError(f'Party size cannot exceed {MAX_PARTY_SIZE} guests.')
        return value

    def validate_special_requests(self, value):
        value = _sanitize(value)
        if len(value) > MAX_SPECIAL_REQUESTS_LEN:
            raise serializers.ValidationError(
                f'Special requests cannot exceed {MAX_SPECIAL_REQUESTS_LEN} characters.'
            )
        return value

    def validate_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError('Reservation date cannot be in the past.')
        # Prevent reservations more than 90 days out (spam / holding tables)
        max_days = 90
        if (value - timezone.now().date()).days > max_days:
            raise serializers.ValidationError(f'Reservations can only be made up to {max_days} days in advance.')
        return value

    def validate_reservation_type(self, value):
        allowed = [Reservation.TYPE_TABLE, Reservation.TYPE_GUESTLIST]
        if value not in allowed:
            raise serializers.ValidationError('Invalid reservation type.')
        return value

    # ── Cross-field / business-logic validation ────────────

    def validate(self, data):
        user = self.context['request'].user
        venue = data.get('venue')
        date = data.get('date')

        if not venue or not date:
            return data

        # 1. Venue must be open for reservations
        if not venue.is_open:
            raise serializers.ValidationError({'venue': 'This venue is not currently accepting reservations.'})

        # 2. Duplicate reservation: same user, same venue, same date, still active
        duplicate = Reservation.objects.filter(
            user=user,
            venue=venue,
            date=date,
            status__in=[Reservation.STATUS_PENDING, Reservation.STATUS_ACCEPTED],
        ).exists()
        if duplicate:
            raise serializers.ValidationError(
                'You already have a pending or confirmed reservation at this venue on that date.'
            )

        # 3. Cap active reservations per user (anti-spam)
        active_count = Reservation.objects.filter(
            user=user,
            status__in=[Reservation.STATUS_PENDING, Reservation.STATUS_ACCEPTED],
            date__gte=timezone.now().date(),
        ).count()
        if active_count >= MAX_ACTIVE_RESERVATIONS:
            raise serializers.ValidationError(
                f'You can have at most {MAX_ACTIVE_RESERVATIONS} upcoming reservations at a time.'
            )

        return data

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

    def validate_rejection_reason(self, value):
        # Required when rejecting
        if self.initial_data.get('status') == Reservation.STATUS_REJECTED and not value:
            raise serializers.ValidationError('A reason is required when rejecting a reservation.')
        return (value or '')[:500]
