from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Proyectos CNC
    path('projects/', views.CNCProjectListView.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.CNCProjectDetailView.as_view(), name='project-detail'),
    path('stats/', views.project_stats, name='project-stats'),
    
    # Autenticación
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/profile/', views.user_profile, name='user-profile'),
    
    # Suscripciones
    path('subscription/subscribe/', views.subscribe_user, name='subscribe'),
    path('explanation/<int:explanation_id>/access/', views.check_explanation_access, name='explanation-access'),
    
    # Solicitudes de explicación
    path('explanation-request/', views.request_explanation, name='request-explanation'),
    path('my-requests/', views.user_explanation_requests, name='user-requests'),
]