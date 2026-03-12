import random
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import AdCampaign, AdImpression, AdFreeSubscription
from .serializers import AdCampaignSerializer, AdFeedSerializer, AdFreeSubscriptionSerializer

AD_FREE_PRICES = {
    'monthly': 30,
    'yearly': 365,
}


class AdCampaignViewSet(viewsets.ModelViewSet):
    serializer_class = AdCampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AdCampaign.objects.filter(venue__owner=self.request.user)

    def perform_create(self, serializer):
        venue = serializer.validated_data['venue']
        if venue.owner != self.request.user:
            raise PermissionDenied('You do not own this venue.')
        serializer.save()

    def perform_update(self, serializer):
        venue = serializer.instance.venue
        if venue.owner != self.request.user:
            raise PermissionDenied('You do not own this venue.')
        serializer.save()


class AdFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.ads_free_sub
            if sub.is_active:
                return Response(status=status.HTTP_204_NO_CONTENT)
        except AdFreeSubscription.DoesNotExist:
            pass

        today = timezone.now().date()
        active_campaigns = list(AdCampaign.objects.filter(
            status=AdCampaign.STATUS_ACTIVE,
            start_date__lte=today,
            end_date__gte=today,
            spent__lt=F('budget'),
        ))

        if not active_campaigns:
            return Response(status=status.HTTP_204_NO_CONTENT)

        campaign = random.choice(active_campaigns)
        return Response(AdFeedSerializer(campaign, context={'request': request}).data)


class AdImpressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, campaign_id):
        try:
            with transaction.atomic():
                campaign = AdCampaign.objects.select_for_update().get(
                    pk=campaign_id, status=AdCampaign.STATUS_ACTIVE
                )
                campaign.spent = float(campaign.spent) + float(campaign.cost_per_impression)
                if float(campaign.spent) >= float(campaign.budget):
                    campaign.status = AdCampaign.STATUS_COMPLETED
                campaign.save()
                AdImpression.objects.create(campaign=campaign, user=request.user)
        except AdCampaign.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response({'status': 'recorded'})


class AdSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.ads_free_sub
            return Response(AdFreeSubscriptionSerializer(sub).data)
        except AdFreeSubscription.DoesNotExist:
            return Response({'is_active': False})

    def post(self, request):
        plan = request.data.get('plan', 'monthly')
        if plan not in AD_FREE_PRICES:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_400_BAD_REQUEST)
        expires_at = timezone.now() + timedelta(days=AD_FREE_PRICES[plan])
        sub, _ = AdFreeSubscription.objects.update_or_create(
            user=request.user,
            defaults={'plan': plan, 'expires_at': expires_at},
        )
        return Response(AdFreeSubscriptionSerializer(sub).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        try:
            request.user.ads_free_sub.delete()
        except AdFreeSubscription.DoesNotExist:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)
