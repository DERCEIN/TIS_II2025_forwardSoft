# ForwardSoft Backend API

Backend API desarrollado en PHP para el sistema ForwardSoft, compatible con PHP 7.4.22 y 8.2.

## Características

- ✅ API REST con PHP puro
- ✅ Autenticación JWT
- ✅ Sistema de roles (Admin, Coordinador, Evaluador)
- ✅ Base de datos PostgreSQL 15.10
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ CORS configurado
- ✅ Compatible con PHP 7.4.22 y 8.2

## Estructura del Proyecto

```
backend/
├── public/
│   ├── index.php          # Punto de entrada de la aplicación
│   └── .htaccess          # Configuración de Apache
├── src/
│   ├── Config/
│   │   ├── App.php        # Configuración de la aplicación
│   │   └── Database.php   # Conexión a la base de datos
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── UserController.php
│   │   ├── AdminController.php
│   │   ├── CoordinadorController.php
│   │   └── EvaluadorController.php
│   ├── Models/
│   │   └── User.php       # Modelo de usuario
│   ├── Routes/
│   │   └── Router.php     # Sistema de rutas
│   └── Utils/
│       ├── Response.php   # Utilidades de respuesta
│       └── JWT.php        # Manejo de JWT
├── database/
│   └── schema.sql         # Esquema de la base de datos
├── logs/                  # Archivos de log
├── vendor/                # Dependencias de Composer
├── composer.json          # Configuración de Composer
└── env.example            # Variables de entorno de ejemplo
```

## Instalación

### Requisitos

- PHP 7.4.22 o superior (compatible con PHP 8.2)
- PostgreSQL 15.10
- Apache con mod_rewrite habilitado
- Composer
- Extensión PHP pdo_pgsql

### Pasos de instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd backend
   ```

2. **Instalar dependencias**
   ```bash
   composer install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   APP_NAME=ForwardSoft
   APP_ENV=development
   APP_DEBUG=true
   APP_URL=http://localhost:8000
   
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=forwardsoft_db
   DB_USERNAME=postgres
   DB_PASSWORD=tu_password
   
   JWT_SECRET=tu-clave-secreta-muy-segura
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION=3600
   ```

4. **Configurar la base de datos PostgreSQL**
   
   **Opción 1: Usando psql**
   ```bash
   # Crear la base de datos
   createdb forwardsoft_db
   
   # Importar el esquema
   psql -d forwardsoft_db -f database/schema.sql
   ```
   
   **Opción 2: Usando pgAdmin o cliente gráfico**
   - Crear base de datos `forwardsoft_db`
   - Ejecutar el contenido de `database/schema.sql`

5. **Configurar el servidor web**
   
   **Apache**: Asegúrate de que el DocumentRoot apunte a la carpeta `public/`
   
   **Nginx**: Configuración de ejemplo:
   ```nginx
   server {
       listen 80;
       server_name localhost;
       root /path/to/backend/public;
       index index.php;
       
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
       
       location ~ \.php$ {
           fastcgi_pass 127.0.0.1:9000;
           fastcgi_index index.php;
           fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
           include fastcgi_params;
       }
   }
   ```

## Uso

### Endpoints disponibles

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener información del usuario actual

#### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `GET /api/users/{id}` - Obtener usuario por ID
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario (Admin)

#### Dashboard
- `GET /api/admin/dashboard` - Dashboard de administrador
- `GET /api/coordinador/dashboard` - Dashboard de coordinador
- `GET /api/evaluador/dashboard` - Dashboard de evaluador

#### Salud del API
- `GET /api/health` - Verificar estado del API

### Ejemplo de uso

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@forwardsoft.com",
    "password": "password"
  }'
```

#### Obtener usuarios (requiere autenticación)
```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer tu-jwt-token"
```

## Usuarios por defecto

El sistema incluye usuarios de ejemplo:

- **Administrador**: admin@forwardsoft.com / password
- **Coordinador**: coordinador@forwardsoft.com / password  
- **Evaluador**: evaluador@forwardsoft.com / password

## Desarrollo

### Estructura de respuestas

Todas las respuestas siguen el formato:

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "timestamp": "2024-01-01 12:00:00"
}
```

### Manejo de errores

```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": { ... },
  "timestamp": "2024-01-01 12:00:00"
}
```

### Autenticación

Incluye el token JWT en el header Authorization:
```
Authorization: Bearer tu-jwt-token
```

## Compatibilidad

- ✅ PHP 7.4.22
- ✅ PHP 8.0
- ✅ PHP 8.1
- ✅ PHP 8.2
- ✅ PostgreSQL 15.10
- ✅ Apache 2.4+
- ✅ Nginx 1.18+

## Licencia

MIT License
