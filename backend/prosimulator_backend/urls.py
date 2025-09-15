"""
URL configuration for prosimulator_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'PROSIMULATOR Backend API',
        'version': '1.0',
        'status': 'running',
        'endpoints': {
            'projects': '/api/projects/',
            'auth': '/api/auth/',
            'admin': '/admin/',
            'stats': '/api/stats/'
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('cnc_portfolio.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
