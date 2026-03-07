from django.db import models
from apps.users.models import User
from apps.venues.models import Venue
from apps.reservations.models import Reservation


class Payment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='payment', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='payments')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    venue_payout = models.DecimalField(max_digits=10, decimal_places=2)

    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.pk} - {self.user.email} - ${self.amount}'

    def save(self, *args, **kwargs):
        if not self.commission_amount:
            rate = self.venue.commission_rate / 100
            self.commission_amount = round(float(self.amount) * rate, 2)
            self.venue_payout = round(float(self.amount) - float(self.commission_amount), 2)
        super().save(*args, **kwargs)
