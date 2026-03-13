from django.db import models
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.venues.models import Venue


class Story(models.Model):
    TYPE_PHOTO = 'photo'
    TYPE_VIDEO = 'video'
    TYPE_CHOICES = [
        (TYPE_PHOTO, 'Photo'),
        (TYPE_VIDEO, 'Video'),
    ]

    SOURCE_VENUE = 'venue'
    SOURCE_USER = 'user'
    SOURCE_CHOICES = [
        (SOURCE_VENUE, 'Venue'),
        (SOURCE_USER, 'User'),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='stories', null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default=SOURCE_VENUE)

    media = models.FileField(upload_to='stories/')
    thumbnail = models.ImageField(upload_to='stories/thumbnails/', null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_PHOTO)
    caption = models.CharField(max_length=500, blank=True)

    # Vibe tags
    vibe_tags = models.JSONField(default=list, blank=True)

    is_active = models.BooleanField(default=True)
    is_moderated = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'stories'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.source} story by {self.author.full_name}'

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class StoryView(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey(User, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_views'
        unique_together = ['story', 'viewer']


class StoryRepost(models.Model):
    original = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='reposts')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='reposted_stories')
    reposted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    reposted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_reposts'


class StoryLike(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_likes'
        unique_together = ['story', 'user']
