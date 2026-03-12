from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.venues.models import Venue


class AdCampaign(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_ACTIVE = 'active'
    STATUS_PAUSED = 'paused'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAUSED, 'Paused'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='ad_campaigns')
    headline = models.CharField(max_length=80)
    body = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='ads/', null=True, blank=True)
    cta_text = models.CharField(max_length=30, default='Book Now')

    budget = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_impression = models.DecimalField(max_digits=6, decimal_places=4, default=0.0100)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    start_date = models.DateField()
    end_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ad_campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.venue.name} — {self.headline}'

    @property
    def impressions_count(self):
        return self.impressions.count()

    @property
    def budget_remaining(self):
        return float(self.budget) - float(self.spent)

    @property
    def is_currently_active(self):
        today = timezone.now().date()
        return (
            self.status == self.STATUS_ACTIVE
            and self.start_date <= today <= self.end_date
            and self.budget_remaining > float(self.cost_per_impression)
        )


class AdImpression(models.Model):
    campaign = models.ForeignKey(AdCampaign, on_delete=models.CASCADE, related_name='impressions')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='ad_impressions')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ad_impressions'


class AdFreeSubscription(models.Model):
    PLAN_MONTHLY = 'monthly'
    PLAN_YEARLY = 'yearly'
    PLAN_CHOICES = [
        (PLAN_MONTHLY, 'Monthly — $4.99/mo'),
        (PLAN_YEARLY, 'Yearly — $39.99/yr'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ads_free_sub')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_MONTHLY)
    expires_at = models.DateTimeField()
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ad_free_subscriptions'

    def __str__(self):
        return f'{self.user.email} — {self.plan}'

    @property
    def is_active(self):
        return self.expires_at > timezone.now()
