from django.urls import path
from .views import (
    StoryFeedView, StoryCreateView, StoryDeleteView,
    view_story, repost_story, AdminStoriesView, moderate_story
)

urlpatterns = [
    path('', StoryFeedView.as_view(), name='story-feed'),
    path('create/', StoryCreateView.as_view(), name='story-create'),
    path('<int:pk>/', StoryDeleteView.as_view(), name='story-delete'),
    path('<int:pk>/view/', view_story, name='story-view'),
    path('<int:pk>/repost/', repost_story, name='story-repost'),
    path('admin/', AdminStoriesView.as_view(), name='admin-stories'),
    path('admin/<int:pk>/moderate/', moderate_story, name='moderate-story'),
]
