from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from .models import Payment
from .serializers import PaymentSerializer, CreatePaymentIntentSerializer
from apps.reservations.models import Reservation


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    serializer = CreatePaymentIntentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    reservation = Reservation.objects.get(
        pk=serializer.validated_data['reservation_id'],
        user=request.user
    )
    amount = serializer.validated_data['amount']

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # cents
            currency='usd',
            metadata={
                'reservation_id': reservation.pk,
                'user_id': request.user.pk,
                'venue_id': reservation.venue.pk,
            }
        )
        payment = Payment.objects.create(
            reservation=reservation,
            user=request.user,
            venue=reservation.venue,
            amount=amount,
            stripe_payment_intent_id=intent.id
        )
        return Response({
            'client_secret': intent.client_secret,
            'payment_id': payment.pk
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def stripe_webhook(request):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'payment_intent.succeeded':
        pi = event['data']['object']
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=pi['id'])
            payment.status = Payment.STATUS_COMPLETED
            payment.stripe_charge_id = pi.get('latest_charge', '')
            payment.completed_at = timezone.now()
            payment.save()
            if payment.reservation:
                payment.reservation.is_deposit_paid = True
                payment.reservation.save()
        except Payment.DoesNotExist:
            pass

    return Response({'status': 'ok'})


class UserPaymentsView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class AdminPaymentsView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Payment.objects.all().order_by('-created_at')
    filterset_fields = ['status', 'currency']
