from django.urls import path
from .views import ai_discover, ai_trending

urlpatterns = [
    path('discover/', ai_discover, name='ai-discover'),
    path('trending/', ai_trending, name='ai-trending'),
]
