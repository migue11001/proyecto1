from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import CNCProject, GCodeExplanation, ExplanationRequest, UserProfile, ProjectView
from .serializers import (
    CNCProjectListSerializer, CNCProjectDetailSerializer, CNCProjectSubscriberSerializer,
    UserRegistrationSerializer, UserProfileSerializer, CreateExplanationRequestSerializer,
    ExplanationRequestSerializer, SubscriptionSerializer
)

def get_client_ip(request):
    """Obtiene la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class CNCProjectListView(generics.ListAPIView):
    """Lista de proyectos para todos los usuarios (público)"""
    queryset = CNCProject.objects.filter(is_active=True)
    serializer_class = CNCProjectListSerializer
    permission_classes = [AllowAny]

class CNCProjectDetailView(generics.RetrieveAPIView):
    """Detalle de proyecto con diferentes niveles según suscripción"""
    queryset = CNCProject.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            try:
                profile = self.request.user.userprofile
                if profile.is_subscribed:
                    return CNCProjectSubscriberSerializer
            except UserProfile.DoesNotExist:
                pass
            return CNCProjectDetailSerializer
        return CNCProjectListSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Registrar visualización
        ProjectView.objects.create(
            project=instance,
            user=request.user if request.user.is_authenticated else None,
            ip_address=get_client_ip(request)
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Registro de nuevo usuario"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'subscription_status': 'free'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login de usuario"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username and password:
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            
            # Obtener o crear perfil
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'subscription_status': profile.subscription_status,
                'is_subscribed': profile.is_subscribed
            })
    
    return Response({
        'error': 'Credenciales inválidas'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Perfil del usuario autenticado"""
    try:
        profile = request.user.userprofile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        # Crear perfil si no existe
        profile = UserProfile.objects.create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_explanation(request):
    """Solicitar explicación de código G"""
    serializer = CreateExplanationRequestSerializer(data=request.data)
    if serializer.is_valid():
        explanation_request = serializer.save(user=request.user)
        
        # Serializar respuesta completa
        response_serializer = ExplanationRequestSerializer(explanation_request)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_explanation_requests(request):
    """Lista de solicitudes del usuario"""
    requests = ExplanationRequest.objects.filter(user=request.user)
    serializer = ExplanationRequestSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_user(request):
    """Activar suscripción £5/mes"""
    try:
        profile = request.user.userprofile
        
        # Aquí integrarías con Stripe/PayPal
        # Por ahora simulamos activación directa
        profile.subscription_status = 'active'
        from datetime import date, timedelta
        profile.subscription_start = date.today()
        profile.subscription_end = date.today() + timedelta(days=30)
        profile.save()
        
        serializer = SubscriptionSerializer(profile)
        return Response({
            'message': 'Suscripción activada exitosamente',
            'subscription': serializer.data
        })
        
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Perfil de usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_explanation_access(request, explanation_id):
    """Verificar si el usuario puede acceder a la explicación"""
    explanation = get_object_or_404(GCodeExplanation, id=explanation_id)
    
    try:
        profile = request.user.userprofile
        if profile.is_subscribed:
            return Response({
                'has_access': True,
                'explanation_text': explanation.explanation_text
            })
        else:
            return Response({
                'has_access': False,
                'message': 'Suscripción requerida para acceder a las explicaciones',
                'display_price': str(explanation.display_price)
            })
    except UserProfile.DoesNotExist:
        return Response({
            'has_access': False,
            'message': 'Perfil de usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def project_stats(request):
    """Estadísticas públicas de proyectos"""
    stats = {
        'total_projects': CNCProject.objects.filter(is_active=True).count(),
        'total_views': ProjectView.objects.count(),
        'process_types': list(CNCProject.objects.filter(is_active=True).values_list('process_type', flat=True).distinct())
    }
    return Response(stats)
