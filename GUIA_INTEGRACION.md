# 🔗 Guía de Integración Frontend + Backend - LendEvent

> Manual completo para configurar y ejecutar el sistema completo (frontend y backend) desde cero en tu equipo local.

## 📋 Tabla de Contenidos

- [Introducción](#-introducción)
- [Requisitos Previos](#-requisitos-previos)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Instalación Completa Paso a Paso](#-instalación-completa-paso-a-paso)
- [Configuración de Variables de Entorno](#-configuración-de-variables-de-entorno)
- [Ejecución del Sistema Completo](#-ejecución-del-sistema-completo)
- [Verificación de la Integración](#-verificación-de-la-integración)
- [Flujo de Trabajo Diario](#-flujo-de-trabajo-diario)
- [Solución de Problemas Comunes](#-solución-de-problemas-comunes)
- [Troubleshooting Avanzado](#-troubleshooting-avanzado)

---

## 🎯 Introducción

Esta guía te llevará paso a paso para configurar **todo el sistema LendEvent** en tu máquina local, incluyendo:

- ✅ **Frontend** (React + TypeScript + Vite)
- ✅ **Backend** (Node.js + Express + TypeScript)
- ✅ **Base de Datos** (MongoDB)
- ✅ **Autenticación** (JWT con cookies HttpOnly)
- ✅ **Dominios locales** (app.test.local y api.test.local)
- ✅ **Certificados SSL** (HTTPS local)

Al finalizar esta guía, tendrás el sistema completo funcionando y podrás hacer login desde el frontend que se comunicará con el backend correctamente.

---

## ⚙️ Requisitos Previos

Antes de empezar, necesitas instalar lo siguiente en tu computador:

### 1. Node.js (v20.x o v22.x)

**¿Por qué lo necesitas?**  
Tanto el frontend como el backend están escritos en JavaScript/TypeScript y necesitan Node.js para ejecutarse.

**Instalación:**

#### En Windows:
1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support) - recomendada v20.x o v22.x
3. Ejecuta el instalador (deja opciones por defecto)
4. Reinicia tu terminal

#### En macOS:
```bash
# Opción 1: Descarga desde nodejs.org
# Opción 2: Con Homebrew
brew install node@20
```

#### En Linux (Ubuntu/Debian):
```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verificar instalación:**
```bash
node -v    # Debe mostrar v20.x.x o v22.x.x
npm -v     # Debe mostrar 10.x.x
```

---

### 2. MongoDB (Base de Datos)

**¿Por qué lo necesitas?**  
El backend guarda todos los datos (usuarios, materiales, pedidos, etc.) en MongoDB.

**Opciones de instalación:**

#### Opción A: MongoDB Community (Local - Recomendado para desarrollo)

**Windows:**
1. Descarga desde [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Ejecuta el instalador
3. Selecciona "Complete" installation
4. Marca "Install MongoDB as a Service"
5. Deja el puerto por defecto: 27017

**macOS:**
```bash
# Con Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
# Importar clave pública de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Añadir repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar servicio
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Verificar instalación:**
```bash
# Verificar que MongoDB está corriendo
mongosh --version
# O si usas versión antigua de mongo shell:
mongo --version

# Conectarse a MongoDB (debe abrir el shell)
mongosh
# Deberías ver algo como: test>
# Escribe 'exit' para salir
```

#### Opción B: MongoDB Atlas (Cloud - Más fácil, no requiere instalación local)

1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un cluster (Free tier M0 - gratis)
4. Configura un usuario de base de datos
5. Agrega tu IP a la lista blanca (o permite 0.0.0.0/0 para desarrollo)
6. Obtén la connection string:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/lendevent
   ```

---

### 3. Git (Control de versiones)

**¿Por qué lo necesitas?**  
Para clonar los repositorios del frontend y backend.

**Instalación:**

#### Windows:
1. Descarga desde [git-scm.com](https://git-scm.com/)
2. Ejecuta el instalador (deja opciones por defecto)

#### macOS:
```bash
# Opción 1: Homebrew
brew install git

# Opción 2: Xcode Command Line Tools
xcode-select --install
```

#### Linux:
```bash
sudo apt-get update
sudo apt-get install git
```

**Verificar instalación:**
```bash
git --version
# Debe mostrar: git version 2.x.x
```

---

### 4. Editor de Código (Recomendado)

**Visual Studio Code** (VS Code) - [code.visualstudio.com](https://code.visualstudio.com/)

Es el editor más usado para desarrollo web y tiene excelente soporte para TypeScript, React, y Node.js.

---

### 5. Herramientas Opcionales (Para HTTPS local)

**mkcert** - Para generar certificados SSL locales

Solo necesario si quieres usar HTTPS en desarrollo local (api.test.local y app.test.local).

#### Windows:
```bash
# Con Chocolatey
choco install mkcert

# Con Scoop
scoop install mkcert
```

#### macOS:
```bash
brew install mkcert
brew install nss # Para Firefox
```

#### Linux:
```bash
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

**Configurar mkcert:**
```bash
mkcert -install
```

---

## 🏗️ Arquitectura del Sistema

Antes de empezar con la instalación, es importante entender cómo se comunican las partes del sistema:

```
┌─────────────────────────────────────────────────────────────────┐
│                         TU NAVEGADOR                             │
│                   https://app.test.local                         │
│                    (Puerto 5173 - Vite)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Peticiones HTTP/HTTPS
                     │ (Autenticación con cookies HttpOnly)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                 │
│                  https://api.test.local                          │
│                   (Puerto 8080 - Express)                        │
│                                                                  │
│  - Maneja autenticación (JWT)                                   │
│  - Procesa lógica de negocio                                    │
│  - Valida permisos                                              │
│  - Conecta con MongoDB                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Queries MongoDB
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MONGODB                                    │
│                  mongodb://localhost:27017                       │
│                                                                  │
│  Base de datos: lendevent                                       │
│  - Usuarios, organizaciones, materiales                         │
│  - Pedidos, contratos, facturas                                 │
│  - Etc.                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Flujo de una petición típica:**

1. Usuario hace login en el **frontend** (app.test.local:5173)
2. Frontend envía credenciales al **backend** (api.test.local:8080)
3. Backend valida credenciales contra **MongoDB**
4. Backend genera token JWT y lo envía como **cookie HttpOnly**
5. Frontend guarda la cookie automáticamente (el navegador lo hace)
6. En siguientes peticiones, el navegador incluye la cookie automáticamente
7. Backend valida el token en cada petición y responde con datos

---

## 📥 Instalación Completa Paso a Paso

### Paso 1: Crear una carpeta para el proyecto

```bash
# Crea una carpeta donde vivirán ambos proyectos
mkdir lendevent
cd lendevent
```

Tu estructura quedará así:
```
lendevent/
├── frontend/    (React app)
└── backend/     (Node.js API)
```

---

### Paso 2: Clonar ambos repositorios

```bash
# Aún dentro de la carpeta lendevent/

# Clonar frontend
git clone <URL_DEL_REPO_FRONTEND> frontend
# O si tienes el ZIP, descomprime en la carpeta 'frontend'

# Clonar backend
git clone https://github.com/dum4hx/backend_lend_event_proyecto_formativo_sena.git backend
```

---

### Paso 3: Instalar dependencias del Backend

```bash
# Entra a la carpeta backend
cd backend

# Instala dependencias (puede tardar 2-3 minutos)
npm install
```

**⏳ Espera**: Este comando descarga ~500MB de paquetes. Sé paciente.

---

### Paso 4: Instalar dependencias del Frontend

```bash
# Vuelve a la carpeta raíz y entra al frontend
cd ../frontend

# Instala dependencias (puede tardar 2-3 minutos)
npm install
```

---

### Paso 5: Configurar dominios locales en el archivo hosts

Para que `api.test.local` y `app.test.local` funcionen, debes añadirlos al archivo **hosts** de tu sistema operativo.

#### Windows:

1. Abre el Bloc de notas **como Administrador**
2. Ve a `Archivo > Abrir`
3. Navega a: `C:\Windows\System32\drivers\etc\`
4. Cambia el filtro a "Todos los archivos (*.*)"
5. Abre el archivo `hosts`
6. Añade al final:

```
127.0.0.1 api.test.local
127.0.0.1 app.test.local
```

7. Guarda el archivo

#### macOS / Linux:

```bash
sudo nano /etc/hosts
```

Añade al final:
```
127.0.0.1 api.test.local
127.0.0.1 app.test.local
```

Guarda con `Ctrl + O`, Enter, `Ctrl + X`

**Verificar:**
```bash
ping api.test.local
# Debería responder desde 127.0.0.1
```

---

### Paso 6: Generar certificados SSL (Opcional - para HTTPS)

Si quieres usar HTTPS en desarrollo local (recomendado para probar cookies seguras):

```bash
# En la carpeta backend/
cd backend

# Genera certificados con mkcert
mkcert -cert-file api.test.local.pem -key-file api.test.local-key.pem api.test.local

# En la carpeta frontend/
cd ../frontend
mkcert -cert-file app.test.local.pem -key-file app.test.local-key.pem app.test.local
```

**Nota:** Si no quieres usar HTTPS, puedes saltarte este paso y usar HTTP simple (localhost).

---

## 🔐 Configuración de Variables de Entorno

Ambos proyectos necesitan archivos `.env` con configuración.

### Backend (.env)

```bash
# En la carpeta backend/
cd backend
cp .env.example .env
```

Edita el archivo `.env` con los siguientes valores:

```env
# Puerto del servidor backend
PORT=8080

# Conexión a MongoDB
# Opción 1: MongoDB local
DB_CONNECTION_STRING=mongodb://localhost:27017/lendevent

# Opción 2: MongoDB Atlas (cloud)
# DB_CONNECTION_STRING=mongodb+srv://usuario:password@cluster.mongodb.net/lendevent

# JWT Configuration
JWT_ASYMMETRIC_KEY_ALG='RS256'
JWT_ENC='A256GCM'
JWT_ISSUER='https://api.test.local/'
JWT_AUDIENCE='https://app.test.local/'

# Cookie domain (debe coincidir con tus dominios locales)
COOKIE_DOMAIN=test.local

# Stripe (opcional para desarrollo, usa claves de test)
STRIPE_SECRET_KEY=sk_test_TuClaveDeTestDeStripe
STRIPE_WEBHOOK_SECRET=whsec_TuSecretDeWebhook

# SMTP Email (opcional para desarrollo - puedes dejarlo vacío)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM=noreply@lendevent.com

# Credenciales del Super Admin inicial
INITIAL_ADMIN_EMAIL=admin@lendevent.com
INITIAL_ADMIN_PASSWORD=Admin123!@#

# CORS - Orígenes permitidos (tu frontend)
CORS_ORIGIN=https://app.test.local,http://localhost:5173

# Ambiente
NODE_ENV=development
SKIP_SUBSCRIPTION_CHECK=true
```

**⚠️ Importante:**
- Si usas **MongoDB local**, usa: `mongodb://localhost:27017/lendevent`
- Si usas **MongoDB Atlas**, usa tu connection string de Atlas
- `CORS_ORIGIN` debe incluir la URL de tu frontend
- `INITIAL_ADMIN_PASSWORD` debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos

---

### Frontend (.env)

```bash
# En la carpeta frontend/
cd ../frontend
cp .env.example .env
```

Edita el archivo `.env`:

```env
# URL del backend (CRITICAL - debe coincidir con donde corre tu backend)

# Si usas HTTPS con dominios locales:
VITE_API_BASE_URL=https://api.test.local/api/v1

# Si usas HTTP simple con localhost:
# VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**⚠️ Super importante:**
- **NO pongas barra `/` al final** de la URL
- Si el backend está en `http://localhost:8080`, entonces usa `http://localhost:8080/api/v1`
- Si usas dominios locales con SSL, usa `https://api.test.local/api/v1`

---

### Generar claves JWT (Backend)

El backend necesita claves RSA para firmar tokens JWT:

```bash
# En la carpeta backend/
cd backend

npm run generate-keys
```

Esto crea archivos en `backend/keys/`:
- `private.pem` - Clave privada (firma tokens)
- `public.pem` - Clave pública (verifica tokens)

---

### Crear usuario Super Admin (Backend)

```bash
# En la carpeta backend/
cd backend

npm run seed:admin
```

Esto crea:
- Una organización especial "Platform Administration"
- Un usuario super admin con el email y password de tu `.env`

**Output esperado:**
```
✅ Super admin seeded successfully
Email: admin@lendevent.com
```

---

## ▶️ Ejecución del Sistema Completo

### Orden de Ejecución

**IMPORTANTE:** Debes iniciar el **backend primero**, luego el **frontend**.

### 1. Iniciar MongoDB

Si usas MongoDB local, asegúrate de que esté corriendo:

#### Windows:
MongoDB debería iniciarse automáticamente como servicio. Verifica en:
- Servicios de Windows → Busca "MongoDB"
- O ejecuta: `services.msc` y busca MongoDB Server

#### macOS:
```bash
brew services start mongodb-community
```

#### Linux:
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**Verificar:**
```bash
mongosh
# Deberías ver: test>
# Escribe 'exit' para salir
```

---

### 2. Iniciar el Backend

Abre una **terminal nueva** para el backend:

```bash
# Navega a la carpeta backend
cd lendevent/backend

# Inicia el servidor de desarrollo
npm run dev
```

**Output esperado:**
```
🚀 Server is running on http://localhost:8080
📚 API Documentation: http://localhost:8080/api/v1
🔗 Connected to MongoDB
```

**⚠️ Errores comunes:**
- Si dice "MongoDB connection failed", verifica que MongoDB esté corriendo
- Si dice "Port 8080 already in use", mata el proceso anterior o cambia el puerto en `.env`

**Deja esta terminal abierta** - el backend debe seguir corriendo.

---

### 3. Iniciar el Frontend

Abre una **terminal nueva** (diferente a la del backend):

```bash
# Navega a la carpeta frontend
cd lendevent/frontend

# Inicia el servidor de desarrollo
npm run dev
```

**Output esperado:**
```
VITE v7.2.5  ready in 543 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
➜  press h + enter to show help
```

**Deja esta terminal abierta también** - el frontend debe seguir corriendo.

---

### 4. Abrir el navegador

Ve a tu navegador y abre:

**Si usas dominios locales con HTTPS:**
```
https://app.test.local:5173
```

**Si usas localhost:**
```
http://localhost:5173
```

Deberías ver la **pantalla de inicio** de LendEvent.

---

## ✅ Verificación de la Integración

Ahora vamos a verificar que todo funciona correctamente paso a paso.

### 1. Verificar que el Backend está activo

Abre otra terminal y ejecuta:

```bash
curl http://localhost:8080/health
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "message": "Server running properly",
  "timestamp": "2026-03-25T...",
  "environment": "development"
}
```

✅ Si ves esto, el backend está funcionando.

---

### 2. Verificar que MongoDB está respondiendo

En la terminal del backend, deberías ver:
```
🔗 Connected to MongoDB
```

Si no ves esto, revisa:
1. ¿MongoDB está corriendo? → `mongosh` debe conectarse
2. ¿El `DB_CONNECTION_STRING` en `.env` es correcto?

---

### 3. Verificar que el Frontend carga

En tu navegador (http://localhost:5173 o https://app.test.local:5173):

1. Deberías ver la **página de inicio** de LendEvent
2. Abre las **DevTools** del navegador (F12)
3. Ve a la pestaña **Console**
4. No deberías ver errores de tipo "Failed to fetch" o "Network Error"

✅ Si ves la página sin errores, el frontend está funcionando.

---

### 4. Probar el Login (Prueba de Integración Completa)

**Este es el momento de la verdad** - vamos a probar que el frontend se comunica con el backend.

#### Paso A: Ir a la página de Login

Haz click en **"Login"** o navega a `/login`

#### Paso B: Ingresar credenciales del Super Admin

Usa las credenciales que configuraste en el `.env` del backend:

- **Email:** `admin@lendevent.com` (o el que pusiste en `INITIAL_ADMIN_EMAIL`)
- **Password:** `Admin123!@#` (o el que pusiste en `INITIAL_ADMIN_PASSWORD`)

#### Paso C: Hacer click en "Login"

**¿Qué debería pasar?**

✅ **Si funciona:**
- El frontend te redirige al dashboard (`/app`)
- Ves tu nombre en la esquina superior derecha
- En las DevTools (F12), pestaña **Network**, deberías ver:
  - Petición `POST /api/v1/auth/login` → Status 200
  - Respuesta con `"status": "success"`

✅ **Si aparece error de CORS:**
```
Access to fetch at 'http://localhost:8080/api/v1/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solución:**
1. Ve al `.env` del backend
2. Asegúrate de que `CORS_ORIGIN` incluye tu URL del frontend:
   ```env
   CORS_ORIGIN=http://localhost:5173,https://app.test.local
   ```
3. **Reinicia el backend** (Ctrl+C y luego `npm run dev` de nuevo)
4. Intenta el login otra vez

✅ **Si aparece "Network Error" o "Failed to fetch":**

**Causas posibles:**

1. **El backend no está corriendo**
   - Verifica la terminal del backend, debe estar activa
   - Prueba: `curl http://localhost:8080/health`

2. **La URL del backend está mal en el frontend**
   - Abre: `frontend/.env`
   - Verifica: `VITE_API_BASE_URL=http://localhost:8080/api/v1`
   - **Reinicia el frontend** después de cambiar `.env` (Ctrl+C y `npm run dev`)

3. **Problema de certificados SSL (si usas HTTPS)**
   - Intenta con HTTP simple primero
   - Cambia `frontend/.env` a: `VITE_API_BASE_URL=http://localhost:8080/api/v1`
   - Accede via: `http://localhost:5173`

---

### 5. Verificar Cookies (Autenticación funcionando)

Si el login fue exitoso, el backend debería haber establecido cookies:

1. En el navegador, abre **DevTools (F12)**
2. Ve a la pestaña **Application** (o **Almacenamiento** en Firefox)
3. En el panel izquierdo, busca **Cookies**
4. Haz click en tu dominio (`http://localhost:5173` o `https://app.test.local`)

**Deberías ver dos cookies:**
- `access_token` - HttpOnly, Secure (si usas HTTPS)
- `refresh_token` - HttpOnly, Secure (si usas HTTPS)

✅ Si ves estas cookies, la autenticación está funcionando correctamente.

---

### 6. Probar una funcionalidad completa (Opcional)

Para asegurarte de que todo funciona end-to-end:

1. **Navega al módulo de Clientes** (`/app/customers`)
2. **Crea un nuevo cliente**
3. **Verifica que aparece en la lista**

Si esto funciona, significa que:
- ✅ Frontend envía peticiones correctamente
- ✅ Backend recibe y procesa peticiones
- ✅ MongoDB guarda datos
- ✅ Frontend recibe y muestra respuestas

---

## 🔄 Flujo de Trabajo Diario

Una vez que tienes todo configurado, el flujo diario es:

### Iniciar el sistema

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (nueva terminal)
cd frontend
npm run dev

# Abrir navegador
# http://localhost:5173 o https://app.test.local:5173
```

### Detener el sistema

En cada terminal:
- Presiona `Ctrl + C`

### Hacer cambios en el código

**Frontend:**
- Los cambios se reflejan automáticamente (Hot Module Replacement)
- No necesitas reiniciar el servidor

**Backend:**
- Los cambios se detectan automáticamente (nodemon)
- El servidor se reinicia automáticamente

---

## 🛠️ Solución de Problemas Comunes

### ❌ Error: "Cannot GET /api/v1/..."

**Causa:** El frontend intenta acceder a una ruta que no existe en el backend.

**Solución:**
1. Verifica que la URL en el frontend sea correcta
2. Revisa la documentación del API en `backend/docs/API_DOCUMENTATION.md`
3. Asegúrate de que el endpoint existe en el backend

---

### ❌ Error: "Unauthorized" (401)

**Causa:** El token JWT expiró o no se envió.

**Solución:**
1. Haz logout y vuelve a hacer login
2. Limpia las cookies del navegador:
   - DevTools (F12) → Application → Cookies → Clear all
3. Verifica que las cookies se están enviando:
   - DevTools → Network → Click en una petición → Headers → Request Headers → Cookie

---

### ❌ Error: "CORS policy" al hacer peticiones

**Causa:** El backend no permite peticiones desde el origen del frontend.

**Solución:**

1. Abre `backend/.env`
2. Añade tu URL de frontend a `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=http://localhost:5173,https://app.test.local
   ```
3. **Reinicia el backend** (Ctrl+C y `npm run dev`)

---

### ❌ Frontend muestra "Failed to fetch"

**Diagnóstico:**

1. **¿El backend está corriendo?**
   ```bash
   curl http://localhost:8080/health
   ```
   Si no responde, el backend no está activo.

2. **¿La URL en el frontend es correcta?**
   ```bash
   cat frontend/.env
   ```
   Debe decir: `VITE_API_BASE_URL=http://localhost:8080/api/v1`

3. **¿Reiniciaste el frontend después de cambiar .env?**
   Las variables de entorno solo se cargan al iniciar Vite.
   - Detén el frontend: Ctrl+C
   - Inicia nuevamente: `npm run dev`

---

### ❌ MongoDB connection failed

**Causa:** El backend no puede conectarse a MongoDB.

**Solución:**

1. **Verifica que MongoDB está corriendo:**
   ```bash
   mongosh
   ```
   Si no conecta, MongoDB no está activo.

   **Windows:** Inicia el servicio desde services.msc  
   **macOS:** `brew services start mongodb-community`  
   **Linux:** `sudo systemctl start mongod`

2. **Verifica la connection string:**
   ```bash
   cat backend/.env | grep DB_CONNECTION_STRING
   ```
   Debe ser:
   - Local: `mongodb://localhost:27017/lendevent`
   - Atlas: `mongodb+srv://usuario:password@cluster.mongodb.net/lendevent`

3. **Si usas MongoDB Atlas:**
   - Verifica que tu IP está en la whitelist
   - Verifica usuario y contraseña
   - Verifica el nombre de la base de datos

---

### ❌ Puerto 8080 ya está en uso

**Causa:** Otro proceso está usando el puerto 8080.

**Solución:**

#### Opción 1: Matar el proceso anterior

**Windows (PowerShell):**
```powershell
# Encuentra el proceso
netstat -ano | findstr :8080

# Mata el proceso (reemplaza PID con el número que sale)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Encuentra y mata el proceso
lsof -ti:8080 | xargs kill -9
```

#### Opción 2: Cambiar el puerto

Edita `backend/.env`:
```env
PORT=8081
```

Y también actualiza `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

**Reinicia ambos servidores.**

---

### ❌ Puerto 5173 ya está en uso

**Causa:** Otro proceso está usando el puerto del frontend.

**Solución:**

Similar al problema anterior, pero para el puerto 5173.

O edita `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000, // Cambia a otro puerto
  },
});
```

---

### ❌ Certificados SSL no confiables

**Causa:** El navegador no confía en los certificados generados con mkcert.

**Solución:**

1. Reinstala el CA de mkcert:
   ```bash
   mkcert -install
   ```

2. Reinicia el navegador completamente

3. Si sigue sin funcionar, usa HTTP en lugar de HTTPS:
   - Backend `.env`: `JWT_ISSUER=http://localhost:8080/`
   - Frontend `.env`: `VITE_API_BASE_URL=http://localhost:8080/api/v1`
   - Accede via: `http://localhost:5173`

---

### ❌ "Cannot find module 'xxx'"

**Causa:** Dependencias no instaladas o node_modules corrupto.

**Solución:**

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ TypeScript errors al iniciar

**Causa:** Versiones incompatibles de TypeScript o tipos.

**Solución:**

```bash
# Backend
cd backend
npm install typescript@latest --save-dev

# Frontend
cd frontend
npm install typescript@latest --save-dev
```

---

## 🔬 Troubleshooting Avanzado

### Ver logs del backend en tiempo real

Los logs se guardan en `backend/logs/`:

```bash
# En la terminal del backend, verás logs en tiempo real
cd backend
npm run dev

# Los logs también se guardan en:
tail -f logs/combined.log  # Todos los logs
tail -f logs/error.log     # Solo errores
```

---

### Verificar que las cookies se envían correctamente

1. Abre **DevTools (F12)** en el navegador
2. Ve a **Network**
3. Haz una petición (ej: navega a `/app/customers`)
4. Click en la petición en la lista
5. Ve a la pestaña **Headers**
6. Busca en **Request Headers**:
   ```
   Cookie: access_token=eyJ...; refresh_token=eyJ...
   ```

Si no ves las cookies, es porque:
- No hiciste login
- Las cookies expiraron
- El dominio de la cookie no coincide con tu URL

---

### Verificar la respuesta del backend manualmente

Usa `curl` o Postman para probar endpoints del backend directamente:

```bash
# Probar health check
curl http://localhost:8080/health

# Probar login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lendevent.com","password":"Admin123!@#"}'
```

---

### Limpiar completamente la base de datos

Si quieres empezar desde cero:

```bash
# Conectarse a MongoDB
mongosh

# Seleccionar la base de datos
use lendevent

# Borrar todas las colecciones
db.dropDatabase()

# Salir
exit

# Volver a crear el super admin
cd backend
npm run seed:admin
```

---

### Verificar variables de entorno cargadas

Para ver qué variables cargó tu aplicación:

**Backend:**
Agrega temporalmente al inicio de `backend/src/server.ts`:
```typescript
console.log('Environment:', {
  PORT: process.env.PORT,
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
  JWT_ISSUER: process.env.JWT_ISSUER,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});
```

**Frontend:**
En cualquier componente:
```typescript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

---

## 📚 Recursos Adicionales

### Documentación

- **API del Backend:** `backend/docs/API_DOCUMENTATION.md`
- **Referencia de Permisos:** `backend/docs/PERMISSIONS_REFERENCE.md`
- **Guía del Frontend:** [README_spanish.md](README_spanish.md)
- **README del Backend:** `backend/README.md`

### Comandos útiles

```bash
# Ver logs del backend
cd backend && npm run dev

# Ver logs del frontend
cd frontend && npm run dev

# Ejecutar tests del backend
cd backend && npm test

# Ejecutar tests del frontend
cd frontend && npm run test

# Formatear código del backend
cd backend && npm run format

# Formatear código del frontend
cd frontend && npm run format
```

---

## 🆘 ¿Aún tienes problemas?

Si después de seguir esta guía sigues teniendo problemas:

1. **Revisa los logs:**
   - Terminal del backend (errores en rojo)
   - Consola del navegador (F12)
   - Archivos en `backend/logs/`

2. **Verifica el checklist:**
   - ✅ MongoDB está corriendo y accesible
   - ✅ Backend `.env` configurado correctamente
   - ✅ Frontend `.env` con la URL correcta del backend
   - ✅ Claves JWT generadas (`backend/keys/`)
   - ✅ Super admin creado (`npm run seed:admin`)
   - ✅ Dominios locales en el archivo hosts (si usas .test.local)
   - ✅ Backend corriendo sin errores
   - ✅ Frontend corriendo sin errores
   - ✅ CORS configurado correctamente

3. **Empieza simple:**
   - Primero haz funcionar todo con HTTP simple (`localhost`)
   - Luego añade HTTPS y dominios personalizados

4. **Contacta al equipo de desarrollo** con:
   - Captura de pantalla del error
   - Logs completos de la terminal
   - Tu sistema operativo y versiones (Node, MongoDB)
   - Pasos que seguiste antes del error

---

## 📄 Resumen de URLs

| Servicio        | URL Local (HTTP)              | URL con HTTPS                   | Puerto |
| --------------- | ----------------------------- | ------------------------------- | ------ |
| **Frontend**    | http://localhost:5173         | https://app.test.local:5173     | 5173   |
| **Backend API** | http://localhost:8080         | https://api.test.local:8080     | 8080   |
| **MongoDB**     | mongodb://localhost:27017     | -                               | 27017  |
| **Health Check**| http://localhost:8080/health  | https://api.test.local/health   | -      |

---

## ✅ Checklist Final

Antes de empezar a desarrollar, verifica que:

- [ ] Node.js v20+ instalado (`node -v`)
- [ ] MongoDB instalado y corriendo (`mongosh`)
- [ ] Git instalado (`git --version`)
- [ ] Backend clonado e instalado (`cd backend && npm install`)
- [ ] Frontend clonado e instalado (`cd frontend && npm install`)
- [ ] Backend `.env` configurado
- [ ] Frontend `.env` configurado
- [ ] Claves JWT generadas (`npm run generate-keys`)
- [ ] Super admin creado (`npm run seed:admin`)
- [ ] Dominios locales añadidos al archivo hosts (opcional)
- [ ] Backend corriendo en terminal 1 (`npm run dev`)
- [ ] Frontend corriendo en terminal 2 (`npm run dev`)
- [ ] Login exitoso en el navegador
- [ ] Cookies `access_token` y `refresh_token` visibles en DevTools

Si todo está marcado, **¡estás listo para desarrollar!** 🚀

---

## 🔄 Próximos Pasos

1. **Familiarízate con el código:**
   - Explora `frontend/src/` para entender los componentes
   - Revisa `backend/src/modules/` para ver la lógica de negocio

2. **Lee la documentación del API:**
   - `backend/docs/API_DOCUMENTATION.md` tiene todos los endpoints documentados

3. **Haz tu primer cambio:**
   - Modifica un componente del frontend
   - Ve los cambios automáticamente en el navegador
   - Haz un commit con Git

4. **Aprende el flujo de datos:**
   - Observa en DevTools (Network tab) cómo el frontend se comunica con el backend
   - Sigue una petición desde el componente → service → API → backend → MongoDB

**¡Buena suerte con el desarrollo!** 💻✨

---

## 📝 Notas Adicionales

### Alternativa: Docker Compose (Opcional)

Si prefieres no instalar MongoDB localmente, el backend incluye configuración de Docker Compose:

```bash
# En la carpeta backend/
cd backend

# Iniciar todos los servicios (API + MongoDB + Nginx)
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener servicios
docker-compose down
```

**Ventajas:**
- No necesitas instalar MongoDB localmente
- Todo se ejecuta en contenedores aislados
- Fácil de limpiar y reiniciar

**Requisitos:**
- Docker y Docker Compose instalados

---

**¡Listo! Ahora tienes la guía completa para ejecutar LendEvent frontend + backend juntos. 🎉**
