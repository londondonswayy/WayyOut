from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'user', 'venue', 'amount', 'commission_amount',
            'venue_payout', 'currency', 'status', 'stripe_payment_intent_id',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'commission_amount', 'venue_payout', 'created_at']


class CreatePaymentIntentSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
