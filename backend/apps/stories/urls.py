from django.urls import path
from .views import (
    StoryFeedView, StoryCreateView, StoryDeleteView,
    view_story, repost_story, like_story,
    story_comments, delete_comment, share_to_friend,
    social_feed, AdminStoriesView, moderate_story,
)

urlpatterns = [
    path('', StoryFeedView.as_view(), name='story-feed'),
    path('feed/social/', social_feed, name='social-feed'),
    path('create/', StoryCreateView.as_view(), name='story-create'),
    path('<int:pk>/', StoryDeleteView.as_view(), name='story-delete'),
    path('<int:pk>/view/', view_story, name='story-view'),
    path('<int:pk>/like/', like_story, name='like-story'),
    path('<int:pk>/comments/', story_comments, name='story-comments'),
    path('<int:pk>/comments/<int:comment_id>/', delete_comment, name='delete-comment'),
    path('<int:pk>/share/', share_to_friend, name='share-story'),
    path('<int:pk>/repost/', repost_story, name='story-repost'),
    path('admin/', AdminStoriesView.as_view(), name='admin-stories'),
    path('admin/<int:pk>/moderate/', moderate_story, name='moderate-story'),
]
