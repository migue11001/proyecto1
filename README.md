# PROSIMULATOR - CNC Portfolio Professional

Sistema completo para portafolio CNC con suscripciones y gestión de contenido.

## 🎯 Características

- **Frontend Multi-idioma**: Italiano, Inglés, Español
- **Backend Django**: API REST + Panel Admin
- **Sistema de Suscripciones**: £0 gratis / £5 premium mensual
- **Gestión de Proyectos CNC**: Códigos G-code con explicaciones
- **Autenticación JWT**: Segura y escalable

## 🚀 Despliegue

### Frontend (Railway)
- Archivos estáticos servidos por Express.js
- Conecta con backend Django via API

### Backend (Railway)
- Django + PostgreSQL
- Panel admin en `/admin`
- API REST en `/api`

## 👥 Usuarios Demo

```
🆓 Usuario Gratis:
   Email: demo@prosimulator.com
   Password: demo123

💎 Usuario Premium:
   Email: subscriber@prosimulator.com
   Password: premium123

🔧 Admin:
   Username: otero
   Password: otero2024
```

## 🛠️ Desarrollo Local

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
# Servidor simple para desarrollo
python -m http.server 8080
# O usar el servidor Express
node server.js
```

## 📋 Variables de Entorno

```env
SECRET_KEY=your-secret-key
DEBUG=False
USE_SQLITE=False
DB_NAME=railway_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
```

## 🎯 Estructura del Proyecto

```
prosimulator/
├── frontend/
│   ├── index.html          # Homepage italiano
│   ├── videos.html         # Portfolio italiano
│   ├── en.html            # Homepage inglés
│   ├── videos-en.html     # Portfolio inglés  
│   ├── es.html            # Homepage español
│   ├── videos-es.html     # Portfolio español
│   ├── styles.css         # Estilos principales
│   ├── portfolio.js       # Lógica frontend
│   ├── api.js            # Integración API
│   └── server.js         # Express server
└── backend/
    ├── prosimulator_backend/    # Configuración Django
    ├── cnc_portfolio/          # App principal
    ├── requirements.txt        # Dependencias Python
    └── manage.py              # Django CLI
```

## 🔧 Funcionalidades Admin

OTERO puede gestionar desde `/admin`:
- ✅ Proyectos CNC (título, descripción, código G)
- ✅ Explicaciones con precios
- ✅ Usuarios y suscripciones
- ✅ Solicitudes de clientes
- ✅ Analytics de visualizaciones

---

**© 2024 PROSIMULATOR - Especialista Fusion 360 & CNC**