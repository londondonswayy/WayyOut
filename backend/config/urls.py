from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('health/', health),
    path('admin/', admin.site.urls),

    # API Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # App APIs
    path('api/auth/', include('apps.users.urls')),
    path('api/venues/', include('apps.venues.urls')),
    path('api/reservations/', include('apps.reservations.urls')),
    path('api/stories/', include('apps.stories.urls')),
    path('api/ai/', include('apps.ai_agent.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/ads/', include('apps.ads.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
