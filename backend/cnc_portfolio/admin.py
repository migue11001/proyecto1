from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import UserProfile, CNCProject, GCodeExplanation, ProjectView, ExplanationRequest

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_subscription_status')
    list_filter = ('is_staff', 'userprofile__subscription_status')
    
    def get_subscription_status(self, obj):
        try:
            return obj.userprofile.subscription_status
        except UserProfile.DoesNotExist:
            return 'No profile'
    get_subscription_status.short_description = 'Subscription'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'subscription_status', 'subscription_start', 'subscription_end', 'is_subscribed')
    list_filter = ('subscription_status', 'subscription_start')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('created_at',)

class GCodeExplanationInline(admin.TabularInline):
    model = GCodeExplanation
    extra = 1
    fields = ('explanation_key', 'gcode_line', 'explanation_text', 'display_price')

@admin.register(CNCProject)
class CNCProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'process_type', 'material', 'consultation_price', 'is_active', 'created_at')
    list_filter = ('process_type', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'material')
    readonly_fields = ('created_at',)
    inlines = [GCodeExplanationInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'description', 'material', 'process_type')
        }),
        ('Código y Precios', {
            'fields': ('cnc_code', 'consultation_price')
        }),
        ('Media y Estado', {
            'fields': ('media_urls', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(GCodeExplanation)
class GCodeExplanationAdmin(admin.ModelAdmin):
    list_display = ('project', 'explanation_key', 'gcode_line', 'display_price', 'created_at')
    list_filter = ('explanation_key', 'display_price', 'project__process_type')
    search_fields = ('project__title', 'explanation_key', 'gcode_line', 'explanation_text')
    readonly_fields = ('created_at',)

@admin.register(ExplanationRequest)
class ExplanationRequestAdmin(admin.ModelAdmin):
    list_display = ('contact_name', 'contact_email', 'explanation', 'status', 'requested_at')
    list_filter = ('status', 'requested_at', 'explanation__explanation_key')
    search_fields = ('contact_name', 'contact_email', 'explanation__project__title')
    readonly_fields = ('requested_at',)
    
    fieldsets = (
        ('Información de Contacto', {
            'fields': ('contact_name', 'contact_email', 'contact_phone')
        }),
        ('Solicitud', {
            'fields': ('user', 'explanation', 'additional_message')
        }),
        ('Estado', {
            'fields': ('status', 'requested_at')
        }),
    )

@admin.register(ProjectView)
class ProjectViewAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at', 'project')
    search_fields = ('project__title', 'user__email', 'ip_address')
    readonly_fields = ('viewed_at',)

# Personalización del sitio admin
admin.site.site_header = "PROSIMULATOR - Panel de Administración"
admin.site.site_title = "PROSIMULATOR Admin"
admin.site.index_title = "Gestión de Proyectos CNC"
