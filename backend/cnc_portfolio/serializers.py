from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, CNCProject, GCodeExplanation, ExplanationRequest, ProjectView

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'subscription_status', 'subscription_start', 'subscription_end', 'is_subscribed']

class GCodeExplanationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GCodeExplanation
        fields = ['id', 'gcode_line', 'explanation_text', 'explanation_key', 'display_price']

class CNCProjectListSerializer(serializers.ModelSerializer):
    """Serializer para lista de proyectos (usuarios no autenticados)"""
    
    class Meta:
        model = CNCProject
        fields = ['id', 'title', 'description', 'material', 'process_type', 'consultation_price', 'created_at']

class CNCProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para usuarios autenticados"""
    explanations = GCodeExplanationSerializer(many=True, read_only=True)
    
    class Meta:
        model = CNCProject
        fields = [
            'id', 'title', 'description', 'material', 'process_type', 
            'cnc_code', 'consultation_price', 'media_urls', 'created_at', 'explanations'
        ]

class CNCProjectSubscriberSerializer(serializers.ModelSerializer):
    """Serializer con explicaciones completas para suscriptores"""
    explanations = serializers.SerializerMethodField()
    
    class Meta:
        model = CNCProject
        fields = [
            'id', 'title', 'description', 'material', 'process_type', 
            'cnc_code', 'consultation_price', 'media_urls', 'created_at', 'explanations'
        ]
    
    def get_explanations(self, obj):
        """Incluye texto completo de explicaciones para suscriptores"""
        explanations = obj.explanations.all()
        return GCodeExplanationSerializer(explanations, many=True).data

class ExplanationRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    explanation = GCodeExplanationSerializer(read_only=True)
    
    class Meta:
        model = ExplanationRequest
        fields = [
            'id', 'user', 'explanation', 'contact_name', 'contact_email', 
            'contact_phone', 'additional_message', 'status', 'requested_at'
        ]

class CreateExplanationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExplanationRequest
        fields = ['explanation', 'contact_name', 'contact_email', 'contact_phone', 'additional_message']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        # Crear perfil de usuario
        UserProfile.objects.create(user=user)
        
        return user

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['subscription_status', 'subscription_start', 'subscription_end']