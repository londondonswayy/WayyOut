from django.urls import path
from .views import ai_chat, ai_discover, ai_trending

urlpatterns = [
    path('chat/', ai_chat, name='ai-chat'),
    path('discover/', ai_discover, name='ai-discover'),
    path('trending/', ai_trending, name='ai-trending'),
]
