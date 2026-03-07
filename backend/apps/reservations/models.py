from django.db import models
from apps.users.models import User
from apps.venues.models import Venue
import uuid


class Reservation(models.Model):
    TYPE_TABLE = 'table'
    TYPE_GUESTLIST = 'guest_list'
    TYPE_CHOICES = [
        (TYPE_TABLE, 'Table Reservation'),
        (TYPE_GUESTLIST, 'Guest List'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    reference = models.CharField(max_length=12, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='reservations')

    reservation_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_TABLE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    date = models.DateField()
    time = models.TimeField()
    party_size = models.IntegerField(default=1)
    table_number = models.CharField(max_length=20, blank=True)

    special_requests = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    # Payment
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_deposit_paid = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'reservations'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} - {self.user.full_name} @ {self.venue.name}'

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = uuid.uuid4().hex[:10].upper()
        super().save(*args, **kwargs)
