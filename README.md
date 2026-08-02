# TASK BLOQ

TASK BLOQ es una aplicación web para organizar actividades académicas mediante un tablero de seguimiento.

El sistema permite iniciar sesión, administrar actividades, asignar responsables, establecer fechas límite, registrar comentarios, adjuntar evidencias y visualizar el avance general del proyecto.

## Tecnologías

### Frontend

- React
- Vite
- React Router DOM
- Lucide React

### Backend

- Node.js
- Express
- PostgreSQL
- JSON Web Tokens
- bcryptjs
- Cookie Parser

### Infraestructura

- Docker
- Docker Compose
- Git
- Git Flow básico

---

## Funciones implementadas

Actualmente el proyecto incluye:

- Base de datos PostgreSQL ejecutándose en Docker.
- Endpoint para comprobar la conexión con PostgreSQL.
- Usuario Administrador precargado.
- Usuario general precargado.
- Pantalla de inicio de sesión.
- Validación de campos obligatorios.
- Validación de correo y contraseña.
- Mensaje de credenciales incorrectas.
- Generación de access token.
- Generación de refresh token.
- Refresh token almacenado en cookie HTTP-only.
- Dashboard general protegido.
- Cierre de sesión.

---

## Roles del sistema

### Administrador

El Administrador será responsable de gestionar las cuentas que tendrán acceso a TASK BLOQ.

Funciones previstas:

- Registrar usuarios.
- Consultar usuarios.
- Editar usuarios.
- Activar o desactivar cuentas.
- Asignar roles.
- Restablecer contraseñas.

### Usuario

El Usuario será responsable de trabajar con las actividades académicas.

Funciones previstas:

- Crear actividades.
- Editar actividades creadas.
- Asignar responsables.
- Definir fechas límite.
- Asignar prioridades.
- Cambiar el estatus de actividades.
- Registrar comentarios.
- Agregar evidencias.
- Consultar el tablero.
- Consultar indicadores de avance.

---

## Estructura general

```text
task-bloq/
├── backend/
│   ├── src/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── migrations/
│   │   └── schema.sql
│   ├── seeds/
│   └── scripts/
│
├── docs/
│   ├── diagramas/
│   ├── evidencias/
│   └── pruebas/
│
├── compose.yaml
├── .gitignore
└── README.md
```

---

## Requisitos

Antes de iniciar, verifica que estén instalados:

- Node.js
- npm
- Git
- Docker Desktop
- Docker Compose

Comandos de validación:

```powershell
node -v
npm -v
git --version
docker --version
docker compose version
```

---

## Clonar el repositorio

```powershell
git clone URL_DEL_REPOSITORIO
cd task-bloq
```

Para trabajar con la rama de desarrollo:

```powershell
git switch develop
git pull origin develop
```

---

# Configuración de la base de datos

## Iniciar Docker Desktop

Antes de levantar PostgreSQL, confirma que Docker Desktop esté abierto y funcionando.

## Levantar PostgreSQL

Desde la raíz del proyecto:

```powershell
docker compose up -d
```

Para recrear el contenedor:

```powershell
docker compose up -d --force-recreate
```

## Verificar el estado

```powershell
docker compose ps
```

Resultado esperado:

```text
taskbloq_database   Up (healthy)
```

La configuración actual utiliza:

```text
Base de datos: taskbloq
Usuario: taskbloq_user
Puerto local: 5433
Puerto interno del contenedor: 5432
```

## Consultar los logs

```powershell
docker compose logs --tail=100 database
```

La base estará lista cuando aparezca:

```text
database system is ready to accept connections
```

## Consultar las tablas

```powershell
docker compose exec database psql -U taskbloq_user -d taskbloq -c "\dt"
```

Tablas esperadas:

```text
usuarios
actividades
comentarios
evidencias
refresh_tokens
```

## Consultar los usuarios precargados

```powershell
docker compose exec database psql -U taskbloq_user -d taskbloq -c "SELECT id_usuario, nombre, correo, rol, estado FROM usuarios;"
```

---

# Usuarios de demostración

Estas cuentas se crean automáticamente desde `database/migrations/schema.sql`.

## Administrador

```text
Correo: admin@taskbloq.edu
Contraseña: TaskBloq2026
Rol: ADMIN
```

## Usuario general

```text
Correo: usuario@taskbloq.edu
Contraseña: Usuario2026
Rol: USUARIO
```

Estas credenciales son únicamente para desarrollo y demostración.

No deben utilizarse en producción.

---

# Configuración del backend

## Crear las variables de entorno

Dentro de `backend`, crea un archivo llamado:

```text
.env
```

Contenido:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://taskbloq_user:taskbloq_dev_password@localhost:5433/taskbloq

JWT_ACCESS_SECRET=task_bloq_access_secret_desarrollo_2026_muy_largo
JWT_REFRESH_SECRET=task_bloq_refresh_secret_desarrollo_2026_diferente

ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_DAYS=7

NODE_ENV=development
```

También debe existir un archivo `.env.example` sin secretos reales.

## Instalar dependencias

```powershell
cd backend
npm install
```

## Ejecutar el backend

```powershell
npm run dev
```

Resultado esperado:

```text
TASK BLOQ API: http://localhost:3001
Health: http://localhost:3001/api/health
```

El backend debe permanecer activo en esa terminal.

---

# Configuración del frontend

Abre otra terminal desde la raíz:

```powershell
cd frontend
npm install
```

Crea:

```text
frontend/.env
```

Contenido:

```env
VITE_API_URL=http://localhost:3001/api
```

## Ejecutar el frontend

```powershell
npm run dev
```

Resultado esperado:

```text
http://localhost:5173
```

Abre esa dirección en el navegador.

---

# Direcciones del sistema

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:3001

Health check:
http://localhost:3001/api/health

PostgreSQL:
localhost:5433
```

---

# Endpoints disponibles

## Health check

Comprueba que la API y PostgreSQL estén conectados.

```http
GET /api/health
```

URL:

```text
http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "ok": true,
  "api": "connected",
  "database": {
    "connected": true,
    "name": "taskbloq",
    "time": "2026-07-13T00:00:00.000Z"
  }
}
```

---

## Iniciar sesión

```http
POST /api/auth/login
```

URL:

```text
http://localhost:3001/api/auth/login
```

Body JSON para Administrador:

```json
{
  "correo": "admin@taskbloq.edu",
  "contrasena": "TaskBloq2026"
}
```

Body JSON para Usuario:

```json
{
  "correo": "usuario@taskbloq.edu",
  "contrasena": "Usuario2026"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "Inicio de sesión correcto.",
  "accessToken": "eyJ...",
  "expiresIn": "15m",
  "usuario": {
    "id": 1,
    "nombre": "Administrador TASK BLOQ",
    "correo": "admin@taskbloq.edu",
    "rol": "ADMIN"
  }
}
```

El refresh token se guarda automáticamente en una cookie HTTP-only.

---

## Credenciales incorrectas

Ejemplo:

```json
{
  "correo": "admin@taskbloq.edu",
  "contrasena": "incorrecta"
}
```

Respuesta esperada:

```json
{
  "ok": false,
  "message": "Correo o contraseña incorrectos."
}
```

Código HTTP esperado:

```text
401 Unauthorized
```

---

## Renovar access token

```http
POST /api/auth/refresh
```

URL:

```text
http://localhost:3001/api/auth/refresh
```

No requiere body.

Debe enviarse la cookie `refreshToken`.

Respuesta esperada:

```json
{
  "ok": true,
  "accessToken": "eyJ...",
  "expiresIn": "15m"
}
```

---

## Consultar dashboard protegido

```http
GET /api/dashboard
```

URL:

```text
http://localhost:3001/api/dashboard
```

Header requerido:

```text
Authorization: Bearer ACCESS_TOKEN
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "Bienvenido al dashboard general.",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Administrador TASK BLOQ",
    "correo": "admin@taskbloq.edu",
    "rol": "ADMIN",
    "estado": "ACTIVO"
  },
  "indicadores": {
    "actividadesTotales": 0,
    "pendientes": 0,
    "enProceso": 0,
    "enRevision": 0,
    "completadas": 0
  }
}
```

---

## Cerrar sesión

```http
POST /api/auth/logout
```

URL:

```text
http://localhost:3001/api/auth/logout
```

La operación:

- Revoca el refresh token.
- Elimina la cookie.
- Finaliza la sesión del usuario.

---

# Pruebas con Postman

## Login correcto

1. Selecciona el método `POST`.
2. Usa la URL:

```text
http://localhost:3001/api/auth/login
```

3. Entra a:

```text
Body → raw → JSON
```

4. Coloca:

```json
{
  "correo": "admin@taskbloq.edu",
  "contrasena": "TaskBloq2026"
}
```

5. Presiona `Send`.
6. Copia el valor de `accessToken`.

## Dashboard protegido

1. Crea una petición `GET`.
2. Usa:

```text
http://localhost:3001/api/dashboard
```

3. Entra a:

```text
Authorization → Bearer Token
```

4. Pega el access token.
5. Presiona `Send`.

## Refresh token

1. Crea una petición `POST`.
2. Usa:

```text
http://localhost:3001/api/auth/refresh
```

3. No agregues body.
4. Verifica que Postman conserve la cookie del login.
5. Presiona `Send`.

---

# Flujo de autenticación

```text
Usuario captura correo y contraseña
              ↓
Frontend envía POST /api/auth/login
              ↓
Backend consulta PostgreSQL
              ↓
Backend compara la contraseña
              ↓
Genera access token
              ↓
Genera refresh token
              ↓
Refresh token se guarda en cookie HTTP-only
              ↓
Frontend guarda temporalmente el access token
              ↓
Usuario entra al dashboard general
```

## Duración de tokens

```text
Access token: 15 minutos
Refresh token: 7 días
```

El access token se guarda en `sessionStorage`.

El refresh token no puede ser leído directamente por JavaScript porque utiliza una cookie HTTP-only.

---

# Detener el sistema

## Detener backend o frontend

En cada terminal:

```text
Ctrl + C
```

## Detener Docker

Desde la raíz:

```powershell
docker compose down
```

Este comando detiene PostgreSQL sin borrar los datos.

---

# Reiniciar completamente la base de datos

Durante el desarrollo puede ser necesario volver a ejecutar `schema.sql`.

```powershell
docker compose down -v
docker compose up -d
```

Advertencia:

```text
docker compose down -v
```

elimina completamente el volumen y todos los datos almacenados.

Al volver a levantar Docker se recrearán:

- Las tablas.
- Los índices.
- Los usuarios de demostración.
- La estructura inicial del sistema.

---

# Comandos útiles

## Ver estado de Docker

```powershell
docker compose ps
```

## Ver logs

```powershell
docker compose logs -f database
```

## Reiniciar PostgreSQL

```powershell
docker compose restart database
```

## Entrar a PostgreSQL

```powershell
docker compose exec database psql -U taskbloq_user -d taskbloq
```

Para salir de PostgreSQL:

```text
\q
```

## Consultar usuarios

```sql
SELECT
    id_usuario,
    nombre,
    correo,
    rol,
    estado
FROM usuarios;
```

## Consultar refresh tokens

```sql
SELECT
    id_refresh_token,
    id_usuario,
    expira_en,
    revocado_en,
    creado_en
FROM refresh_tokens;
```

---

# Compilar el frontend

Para comprobar que React pueda generar una versión de producción:

```powershell
cd frontend
npm run build
```

La compilación se crea en:

```text
frontend/dist/
```

La carpeta `dist` no se sube a Git.

---

# Flujo Git del proyecto

TASK BLOQ utiliza un flujo básico:

```text
feature/*
    ↓ Pull Request
develop
    ↓ release
main
```

## Crear una rama de trabajo

```powershell
git switch develop
git pull origin develop
git switch -c feature/HU-XX-descripcion
```

## Guardar cambios

```powershell
git status
git add .
git commit -m "feat(modulo): descripcion del cambio"
```

## Subir la rama

```powershell
git push -u origin HEAD
```

El Pull Request debe apuntar normalmente a:

```text
develop
```

No se deben enviar cambios directamente a `main`.

---

# Solución de problemas

## PostgreSQL no inicia por contraseña

Verifica que `compose.yaml` contenga:

```yaml
environment:
  POSTGRES_DB: taskbloq
  POSTGRES_USER: taskbloq_user
  POSTGRES_PASSWORD: taskbloq_dev_password
```

## Puerto ocupado

La configuración actual utiliza:

```text
PostgreSQL: 5433
Backend: 3001
Frontend: 5173
```

Para saber si un puerto está ocupado:

```powershell
netstat -ano | findstr :5433
netstat -ano | findstr :3001
netstat -ano | findstr :5173
```

## Backend no responde

Comprueba:

```powershell
Test-NetConnection localhost -Port 3001
```

Resultado esperado:

```text
TcpTestSucceeded : True
```

## La base está saludable, pero el health falla

Revisa:

```text
backend/.env
```

La conexión correcta es:

```env
DATABASE_URL=postgresql://taskbloq_user:taskbloq_dev_password@localhost:5433/taskbloq
```

## El frontend no puede acceder al backend

Comprueba que:

```env
VITE_API_URL=http://localhost:3001/api
```

También reinicia Vite después de modificar `.env`:

```powershell
npm run dev
```

## El dashboard responde 401

El access token puede:

- Estar ausente.
- Estar vencido.
- Ser inválido.

Vuelve a iniciar sesión o utiliza:

```http
POST /api/auth/refresh
```

---

# Evidencias del proyecto

Las capturas y evidencias deben almacenarse en:

```text
docs/evidencias/
```

Ejemplos:

```text
HU-04.01-login.png
HU-04.02-login-exitoso.png
HU-04.02-credenciales-incorrectas.png
HU-04.03-dashboard.png
```

---

## Estado actual

```text
Base de datos PostgreSQL: funcionando
Docker: funcionando
Health check: funcionando
Login visual: implementado
Validación de credenciales: implementada
Access token: implementado
Refresh token: implementado
Dashboard general: implementado
Roles iniciales: ADMIN y USUARIO
```

---

## Equipo

Proyecto académico desarrollado por el equipo de TASK BLOQ para la materia Equipos de Alto Rendimiento.