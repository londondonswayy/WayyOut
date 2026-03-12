from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdCampaignViewSet, AdFeedView, AdImpressionView, AdSubscriptionView

router = DefaultRouter()
router.register('campaigns', AdCampaignViewSet, basename='ad-campaign')

urlpatterns = [
    path('', include(router.urls)),
    path('feed/', AdFeedView.as_view(), name='ad-feed'),
    path('campaigns/<int:campaign_id>/impression/', AdImpressionView.as_view(), name='ad-impression'),
    path('subscription/', AdSubscriptionView.as_view(), name='ad-subscription'),
]
