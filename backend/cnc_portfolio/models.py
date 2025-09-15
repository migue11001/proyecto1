from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class UserProfile(models.Model):
    """Extiende el modelo User de Django para suscripciones"""
    
    SUBSCRIPTION_CHOICES = [
        ('free', 'Free User'),
        ('active', 'Active Subscriber (£5/month)'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    subscription_status = models.CharField(
        max_length=10, 
        choices=SUBSCRIPTION_CHOICES, 
        default='free'
    )
    subscription_start = models.DateField(null=True, blank=True)
    subscription_end = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.email} - {self.subscription_status}"
    
    @property
    def is_subscribed(self):
        """Verifica si el usuario tiene suscripción activa"""
        if self.subscription_status == 'active':
            if self.subscription_end and self.subscription_end >= timezone.now().date():
                return True
        return False


class CNCProject(models.Model):
    """Proyectos CNC de OTERO/PROSIMULATOR"""
    
    PROCESS_CHOICES = [
        ('milling', 'Fresatura'),
        ('turning', 'Tornitura'), 
        ('5axis', 'Lavorazione 5 Assi'),
        ('multiaxis', 'Multi-asse'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    material = models.CharField(max_length=100, blank=True)  # Aluminum 7075, Steel AISI 316L
    process_type = models.CharField(max_length=20, choices=PROCESS_CHOICES)
    cnc_code = models.TextField()
    consultation_price = models.DecimalField(max_digits=10, decimal_places=2)
    media_urls = models.JSONField(default=list)  # Lista de URLs de videos/imágenes
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.process_type}"
    
    def get_media_urls(self):
        """Convierte JSON a lista de URLs"""
        if isinstance(self.media_urls, str):
            try:
                return json.loads(self.media_urls)
            except json.JSONDecodeError:
                return []
        return self.media_urls or []


class GCodeExplanation(models.Model):
    """Explicaciones de códigos G para suscriptores"""
    
    project = models.ForeignKey(CNCProject, on_delete=models.CASCADE, related_name='explanations')
    gcode_line = models.CharField(max_length=200)  # "G01 Z-2 F300"
    explanation_text = models.TextField()  # Explicación detallada
    explanation_key = models.CharField(max_length=50)  # 'setup', 'strategy', 'turning', etc.
    display_price = models.DecimalField(max_digits=10, decimal_places=2)  # Precio mostrado (£15, £20)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['project', 'explanation_key']
        ordering = ['project', 'explanation_key']
    
    def __str__(self):
        return f"{self.project.title} - {self.explanation_key} (£{self.display_price})"


class ProjectView(models.Model):
    """Tracking de visualizaciones de proyectos"""
    
    project = models.ForeignKey(CNCProject, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    viewed_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-viewed_at']


class ExplanationRequest(models.Model):
    """Solicitudes de explicación por parte de usuarios"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('contacted', 'Contactado'),
        ('completed', 'Completado'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    explanation = models.ForeignKey(GCodeExplanation, on_delete=models.CASCADE)
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    additional_message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"{self.contact_name} - {self.explanation.explanation_key} - {self.status}"
