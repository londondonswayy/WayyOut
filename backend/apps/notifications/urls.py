from django.urls import path
from .views import NotificationListView, mark_all_read, mark_read, unread_count

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('unread/', unread_count, name='unread-count'),
    path('mark-all-read/', mark_all_read, name='mark-all-read'),
    path('<int:pk>/read/', mark_read, name='mark-read'),
]
