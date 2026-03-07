from django.db import models
from apps.users.models import User


class Notification(models.Model):
    TYPE_RESERVATION = 'reservation'
    TYPE_STORY = 'story'
    TYPE_SYSTEM = 'system'
    TYPE_PROMOTION = 'promotion'
    TYPE_CHOICES = [
        (TYPE_RESERVATION, 'Reservation'),
        (TYPE_STORY, 'Story'),
        (TYPE_SYSTEM, 'System'),
        (TYPE_PROMOTION, 'Promotion'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type}: {self.title} -> {self.user.email}'
