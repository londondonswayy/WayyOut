from django.urls import path
from .views import create_payment_intent, stripe_webhook, UserPaymentsView, AdminPaymentsView

urlpatterns = [
    path('create-intent/', create_payment_intent, name='create-payment-intent'),
    path('webhook/', stripe_webhook, name='stripe-webhook'),
    path('my/', UserPaymentsView.as_view(), name='my-payments'),
    path('admin/', AdminPaymentsView.as_view(), name='admin-payments'),
]
