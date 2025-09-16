# Aplicaciones Educativas

Dos aplicaciones web educativas para el aprendizaje de idiomas:

## 🎯 Le Mie Parole - Entrenador de Pronunciación
- Herramienta para crear listas personalizadas de palabras en inglés
- Síntesis de voz para practicar la pronunciación
- Interfaz intuitiva con límite de 20 palabras
- Pronunciación automática generada

## 📚 Sistema de Práctica Gramatical  
- Ejercicios interactivos de ordenamiento de palabras
- Análisis gramatical automático
- Interfaz drag & drop
- Resultados y estadísticas

## 🚀 Despliegue en Railway

Este proyecto está configurado para desplegarse automáticamente en Railway desde GitHub.

### Configuración incluida:
- `railway.toml` - Configuración principal de Railway
- `nixpacks.toml` - Configuración del buildpack
- `Dockerfile` - Imagen Docker alternativa
- `package.json` - Metadatos del proyecto

### Pasos para desplegar:
1. Sube el código a un repositorio de GitHub
2. Conecta el repositorio a Railway
3. Railway detectará automáticamente las configuraciones
4. El proyecto se desplegará en el puerto 8080

### URLs de las aplicaciones:
- Página principal: `/`
- Entrenador de pronunciación: `/PRONUNCIA.html`
- Práctica gramatical: `/gramatica.html`

## 🛠️ Tecnologías
- HTML5, CSS3, JavaScript vanilla
- React (para la aplicación gramatical)
- Web Speech API (síntesis de voz)
- Python (servidor HTTP para producción)