#!/usr/bin/env python
"""
Script seguro para configuración de producción
Ejecutar SOLO en Railway después del despliegue
"""
import os
import django
from django.contrib.auth.models import User
from cnc_portfolio.models import UserProfile, CNCProject, GCodeExplanation
from decimal import Decimal
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prosimulator_backend.settings')
django.setup()

def setup_production():
    print("🚀 Configurando producción...")
    
    # 1. Crear superuser para OTERO (usar variables de entorno)
    admin_email = os.environ.get('ADMIN_EMAIL', 'otero@prosimulator.com')
    admin_password = os.environ.get('ADMIN_PASSWORD')  # Debe configurarse en Railway
    
    if admin_password:
        admin_user, created = User.objects.get_or_create(
            username='otero',
            defaults={
                'email': admin_email,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password(admin_password)
            admin_user.save()
            print("✅ Usuario admin creado")
    else:
        print("⚠️ ADMIN_PASSWORD no configurado")
    
    # 2. Crear proyectos si no existen
    if CNCProject.objects.count() == 0:
        create_sample_projects()
        print("✅ Proyectos de ejemplo creados")
    
    # 3. Crear usuarios demo solo si se especifica
    if os.environ.get('CREATE_DEMO_USERS') == 'true':
        create_demo_users()
        print("✅ Usuarios demo creados")

def create_sample_projects():
    # Proyectos seguros sin datos sensibles
    projects = [
        {
            'title': "Fresatura Complessa Alluminio",
            'description': "Lavorazione di precisione su pezzo in alluminio 7075 con tolleranze ±0.02mm.",
            'material': "Alluminio 7075",
            'process_type': "milling",
            'consultation_price': Decimal('45.00'),
            'cnc_code': "G54 G90 G21\nM6 T01\nG43 H01 M03 S3000\nG00 X0 Y0 Z5\nM30"
        },
        {
            'title': "Tornitura di Precisione Acciaio", 
            'description': "Componente tornito in acciaio AISI 316L per settore medicale.",
            'material': "Acciaio AISI 316L",
            'process_type': "turning",
            'consultation_price': Decimal('45.00'),
            'cnc_code': "G54 G90 G21 G95\nM6 T0101\nG96 S180 M03\nM30"
        },
        {
            'title': "Lavorazione 5 Assi Titanio",
            'description': "Componente aerospaziale in titanio Ti-6Al-4V.",
            'material': "Titanio Ti-6Al-4V", 
            'process_type': "5axis",
            'consultation_price': Decimal('65.00'),
            'cnc_code': "G54 G90 G21\nM6 T01\nG43 H01 M03 S8000\nM30"
        }
    ]
    
    for project_data in projects:
        project, created = CNCProject.objects.get_or_create(
            title=project_data['title'],
            defaults=project_data
        )

def create_demo_users():
    # Solo crear si está explícitamente permitido
    demo_password = os.environ.get('DEMO_PASSWORD', 'demo2024!')
    
    # Usuario demo gratuito
    demo_user, created = User.objects.get_or_create(
        username='demo@prosimulator.com',
        defaults={
            'email': 'demo@prosimulator.com',
            'first_name': 'Demo',
            'last_name': 'User'
        }
    )
    if created:
        demo_user.set_password(demo_password)
        demo_user.save()
    
    UserProfile.objects.get_or_create(
        user=demo_user,
        defaults={'subscription_status': 'free'}
    )

if __name__ == "__main__":
    setup_production()