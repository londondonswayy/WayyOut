from django.urls import path
from .views import (
    StoryFeedView, StoryCreateView, StoryDeleteView,
    view_story, repost_story, AdminStoriesView, moderate_story,
    like_story, social_feed
)

urlpatterns = [
    path('', StoryFeedView.as_view(), name='story-feed'),
    path('create/', StoryCreateView.as_view(), name='story-create'),
    path('feed/social/', social_feed, name='social-feed'),
    path('<int:pk>/', StoryDeleteView.as_view(), name='story-delete'),
    path('<int:pk>/view/', view_story, name='story-view'),
    path('<int:pk>/repost/', repost_story, name='story-repost'),
    path('<int:pk>/like/', like_story, name='like-story'),
    path('admin/', AdminStoriesView.as_view(), name='admin-stories'),
    path('admin/<int:pk>/moderate/', moderate_story, name='moderate-story'),
]
