from django.db import models
from apps.users.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Venue(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_SUSPENDED = 'suspended'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    VIBE_CASUAL = 'casual'
    VIBE_LIVELY = 'lively'
    VIBE_ROMANTIC = 'romantic'
    VIBE_UPSCALE = 'upscale'
    VIBE_PARTY = 'party'

    VIBE_CHOICES = [
        (VIBE_CASUAL, 'Casual'),
        (VIBE_LIVELY, 'Lively'),
        (VIBE_ROMANTIC, 'Romantic'),
        (VIBE_UPSCALE, 'Upscale'),
        (VIBE_PARTY, 'Party'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venues')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='venues')

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='US')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    cover_image = models.ImageField(upload_to='venues/covers/', null=True, blank=True)
    logo = models.ImageField(upload_to='venues/logos/', null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    is_open = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    # Crowd & vibe
    busy_level = models.IntegerField(default=0)  # 0-100
    vibe = models.CharField(max_length=20, choices=VIBE_CHOICES, blank=True)
    capacity = models.IntegerField(default=0)
    current_occupancy = models.IntegerField(default=0)

    # Ratings
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.IntegerField(default=0)

    # Commission
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'venues'

    def __str__(self):
        return self.name

    @property
    def is_approved(self):
        return self.status == self.STATUS_APPROVED


class VenuePhoto(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='venues/photos/')
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'venue_photos'
        ordering = ['order']


class OpeningHours(models.Model):
    DAYS = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='opening_hours')
    day = models.IntegerField(choices=DAYS)
    open_time = models.TimeField()
    close_time = models.TimeField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        db_table = 'opening_hours'
        unique_together = ['venue', 'day']
        ordering = ['day']


class VenueAvailability(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='availability_slots')
    date = models.DateField()
    total_seats = models.IntegerField(default=0)
    available_seats = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'venue_availability'
        unique_together = ['venue', 'date']


class VenueReview(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'venue_reviews'
        unique_together = ['venue', 'user']
