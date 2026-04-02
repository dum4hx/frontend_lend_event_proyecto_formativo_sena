# 📖 Manual de Instalación Completo - LendEvent (Frontend + Backend)

**Versión:** 1.0  
**Última actualización:** April 2, 2026  
**Para:** Personas sin experiencia previa - desde cero

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Fase 1: Preparación del Sistema](#fase-1--preparación-del-sistema)
4. [Fase 2: Descargar los Proyectos](#fase-2--descargar-los-proyectos)
5. [Fase 3: Configurar Backend](#fase-3--configurar-backend)
6. [Fase 4: Configurar Frontend](#fase-4--configurar-frontend)
7. [Fase 5: Ejecutar Ambos Proyectos](#fase-5--ejecutar-ambos-proyectos)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Introducción

LendEvent es una plataforma completa de gestión de alquiler de equipos para eventos con:
- **Frontend:** Aplicación web (React 19 + TypeScript + Vite)
- **Backend:** API Rest (Node.js + Express + MongoDB)

Este manual te guiará para instalar todo desde cero en tu computadora.

### ¿Qué necesitarás al final?

✅ Node.js instalado  
✅ MongoDB corriendo  
✅ Git instalado  
✅ Backend ejecutándose en `http://localhost:8080`  
✅ Frontend ejecutándose en `http://localhost:3000`

---

## 💻 Requisitos del Sistema

### Hardware Mínimo

- **Procesador:** Dual-core
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Espacio Disponible:** 5 GB mínimo
- **Conexión a Internet:** Requerida

### Sistema Operativo

✅ Windows 10/11  
✅ macOS 10.15+  
✅ Linux (Ubuntu, Debian, etc.)

---

## ⚙️ Fase 1: Preparación del Sistema

En esta fase instalaremos todas las herramientas necesarias en tu computadora.

### Paso 1.1: Instalar Node.js (Incluye npm)

Node.js es el entorno que ejecuta tanto el backend como las herramientas del frontend.

#### En Windows:

1. Abre **PowerShell como Administrador**
   - Presiona `Win + X` → Selecciona `Windows PowerShell (Administrador)`

2. Copia y pega este comando:
   ```powershell
   choco install nodejs-lts -y
   ```
   
   > Si no tienes Chocolatey instalado, instálalo primero:
   > ```powershell
   > Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   > ```

3. Cierra y reabre PowerShell

4. Verifica la instalación:
   ```powershell
   node --version
   npm --version
   ```
   
   Deberías ver algo como:
   ```
   v22.x.x
   10.x.x
   ```

#### En macOS:

1. Abre Terminal

2. Instala Homebrew si no lo tienes:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. Instala Node.js:
   ```bash
   brew install node@22
   ```

4. Verifica:
   ```bash
   node --version
   npm --version
   ```

#### En Linux (Ubuntu/Debian):

1. Abre Terminal

2. Ejecuta:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Verifica:
   ```bash
   node --version
   npm --version
   ```

---

### Paso 1.2: Instalar Git

Git es necesario para descargar los proyectos desde GitHub.

#### En Windows:

1. Abre PowerShell como Administrador

2. Ejecuta:
   ```powershell
   choco install git -y
   ```

3. Cierra y reabre PowerShell

4. Verifica:
   ```powershell
   git --version
   ```

#### En macOS:

1. Abre Terminal

2. Ejecuta:
   ```bash
   brew install git
   ```

3. Verifica:
   ```bash
   git --version
   ```

#### En Linux:

1. Abre Terminal

2. Ejecuta:
   ```bash
   sudo apt-get install -y git
   ```

3. Verifica:
   ```bash
   git --version
   ```

---

### Paso 1.3: Configurar Git (Primera Vez)

Si es la primera vez que usas Git, configúralo con tu nombre y email:

#### En Windows (PowerShell):

```powershell
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu_email@example.com"
```

#### En macOS/Linux:

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu_email@example.com"
```

Reemplaza `tu_email@example.com` con tu email real.

---

### Paso 1.4: Instalar MongoDB

MongoDB es la base de datos que almacena toda la información.

#### Opción A: MongoDB Local (Más Fácil para Desarrollo)

##### En Windows:

1. Ve a https://www.mongodb.com/try/download/community

2. Descarga el instalador `.msi` para Windows

3. Ejecuta el instalador:
   - Haz clic en `Next` → `I agree` → `Next`
   - Selecciona "Install MongoDB as a Service"
   - Haz clic en `Install`

4. Verifica que MongoDB está corriendo:
   - Abre Services (Presiona `Win + R` → escribe `services.msc`)
   - Busca "MongoDB Server"
   - Debería estar en estado "Running"

##### En macOS:

1. Abre Terminal

2. Instala con Homebrew:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

3. Inicia MongoDB:
   ```bash
   brew services start mongodb-community
   ```

4. Verifica:
   ```bash
   mongosh
   ```
   
   Si ves un prompt `>`, MongoDB está corriendo. Escribe `exit` para salir.

##### En Linux (Ubuntu):

1. Abre Terminal

2. Ejecuta:
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org mongosh
   ```

3. Inicia el servicio:
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. Verifica:
   ```bash
   mongosh
   ```

---

#### Opción B: MongoDB en la Nube (MongoDB Atlas)

Si prefieres no instalar nada localmente:

1. Ve a https://www.mongodb.com/cloud/atlas

2. Crea una cuenta gratuita

3. Crea un cluster gratuito

4. Obtén tu string de conexión (connection string)

5. Guárdalo en un archivo de texto para usarlo después

> ℹ️ Para este manual recomendamos **Opción A** (MongoDB Local) para simplificar.

---

### Paso 1.5: Crear una Carpeta para los Proyectos

Vamos a crear una carpeta donde descargemos ambos proyectos.

#### En Windows (PowerShell):

```powershell
# Crear en C:\
mkdir C:\lendevent-dev
cd C:\lendevent-dev
```

#### En macOS/Linux:

```bash
# Crear en tu home
mkdir ~/lendevent-dev
cd ~/lendevent-dev
```

Desde ahora, todos los comandos los ejecutaremos dentro de esta carpeta.

---

## 📦 Fase 2: Descargar los Proyectos

Vamos a descargar el código del frontend y backend desde GitHub.

### Paso 2.1: Descargar el Backend

#### En Windows (PowerShell):

```powershell
cd C:\lendevent-dev
git clone https://github.com/dum4hx/backend_lend_event_proyecto_formativo_sena.git backend
cd backend
```

#### En macOS/Linux:

```bash
cd ~/lendevent-dev
git clone https://github.com/dum4hx/backend_lend_event_proyecto_formativo_sena.git backend
cd backend
```

**¿Qué pasó?**
- Git descargó todo el código del backend
- Se creó una carpeta llamada `backend`
- Ahora estamos dentro de esa carpeta

---

### Paso 2.2: Descargar el Frontend

Abre una **nueva terminal/PowerShell** (sin cerrar la actual).

#### En Windows (PowerShell):

```powershell
cd C:\lendevent-dev
git clone https://github.com/dum4hx/Frontend_Lend\ Event.git frontend
cd frontend
```

#### En macOS/Linux:

```bash
cd ~/lendevent-dev
git clone https://github.com/dum4hx/Frontend_Lend\ Event.git frontend
cd frontend
```

---

### Paso 2.3: Verificar que Ambas Carpetas Existen

Abre una terminal en tu carpeta `lendevent-dev`:

#### En Windows (PowerShell):

```powershell
cd C:\lendevent-dev
dir
```

Deberías ver:
```
backend/
frontend/
```

#### En macOS/Linux:

```bash
cd ~/lendevent-dev
ls -la
```

Deberías ver:
```
backend/
frontend/
```

---

## 🔧 Fase 3: Configurar Backend

El backend es la API que gestiona toda la lógica del negocio.

### Paso 3.1: Instalar Dependencias del Backend

```powershell
# Windows
cd C:\lendevent-dev\backend
npm install
```

```bash
# macOS/Linux
cd ~/lendevent-dev/backend
npm install
```

**¿Qué hace npm install?**
- Lee el archivo `package.json`
- Descarga todas las librerías necesarias
- Las guarda en carpeta `node_modules/`

⏳ **Nota:** Esto puede tardar 2-5 minutos. Ten paciencia.

---

### Paso 3.2: Crear el Archivo de Configuración (.env)

El archivo `.env` contiene las variables secretas y configuraciones.

#### En Windows (PowerShell):

```powershell
cd C:\lendevent-dev\backend

# Si existe .env.example, cópialo
if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
} else {
    # Si no existe, crea uno vacío
    New-Item ".env" -ItemType File
}
```

#### En macOS/Linux:

```bash
cd ~/lendevent-dev/backend

# Si existe .env.example, cópialo
if [ -f ".env.example" ]; then
    cp .env.example .env
else
    # Si no existe, crea uno vacío
    touch .env
fi
```

---

### Paso 3.3: Editar el Archivo .env

Abre el archivo `.env` con tu editor de texto favorito (Notepad, VS Code, etc.).

**Ruta en Windows:** `C:\lendevent-dev\backend\.env`  
**Ruta en macOS/Linux:** `~/lendevent-dev/backend/.env`

Copia y pega lo siguiente:

```dotenv
# ============================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================
PORT=8080
NODE_ENV=development

# ============================================
# BASE DE DATOS (MongoDB Local)
# ============================================
DB_CONNECTION_STRING=mongodb://localhost:27017/lendevent

# Alternativa: Si usas MongoDB Atlas (nube)
# DB_CONNECTION_STRING=mongodb+srv://usuario:contraseña@cluster.mongodb.net/lendevent

# ============================================
# CONFIGURACIÓN JWT (Autenticación)
# ============================================
JWT_ASYMMETRIC_KEY_ALG=RS256
JWT_ENC=A256GCM
JWT_ISSUER=https://api.test.local/
JWT_AUDIENCE=https://app.test.local/

# ============================================
# COOKIES
# ============================================
COOKIE_DOMAIN=test.local

# ============================================
# STRIPE (Para pagos - OPCIONAL para desarrollo)
# ============================================
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# ============================================
# EMAIL (OPCIONAL para desarrollo)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
SMTP_FROM=noreply@example.com

# ============================================
# USUARIO SUPER ADMIN INICIAL
# ============================================
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=AdminSeguro123!

# ============================================
# CORS (Orígenes permitidos)
# ============================================
CORS_ORIGIN=https://app.test.local,http://localhost:3000,http://localhost:5173

# ============================================
# CONFIGURACIÓN GENERAL
# ============================================
SKIP_SUBSCRIPTION_CHECK=false
```

**Importante:**
- Guarda el archivo después de editar
- **NO hagas commit** de este archivo (ya está en `.gitignore`)
- Estas variables pueden cambiar según tu configuración

---

### Paso 3.4: Generar Claves JWT

Las claves JWT son necesarias para la autenticación.

```powershell
# Windows
cd C:\lendevent-dev\backend
npm run generate-keys
```

```bash
# macOS/Linux
cd ~/lendevent-dev/backend
npm run generate-keys
```

**¿Qué hace?**
- Genera un par de claves RSA
- Las guarda en la carpeta `keys/`
- Estas claves firman los tokens de sesión

Deberías ver un mensaje como:
```
✅ Keys generated successfully in keys/ directory
```

---

### Paso 3.5: Crear Usuario Super Admin (OPCIONAL)

Si quieres crear una cuenta de administrador para acceder a funciones avanzadas:

```powershell
# Windows
cd C:\lendevent-dev\backend
npm run seed:admin
```

```bash
# macOS/Linux
cd ~/lendevent-dev/backend
npm run seed:admin
```

Usa las credenciales del `.env`:
- Email: `admin@example.com`
- Contraseña: `AdminSeguro123!`

---

### Paso 3.6: Probar que el Backend Está Listo

Antes de ejecutar, verifica que:

1. ✅ MongoDB está corriendo
2. ✅ El archivo `.env` está configurado
3. ✅ Las claves JWT existen en `keys/`

---

## 🎨 Fase 4: Configurar Frontend

El frontend es la interfaz web que los usuarios ven.

### Paso 4.1: Instalar Dependencias del Frontend

Abre una **nueva terminal**.

```powershell
# Windows
cd C:\lendevent-dev\frontend
npm install
```

```bash
# macOS/Linux
cd ~/lendevent-dev/frontend
npm install
```

⏳ **Nota:** Esto también puede tardar 2-5 minutos.

---

### Paso 4.2: Crear el Archivo de Configuración del Frontend (.env)

El frontend necesita saber dónde está el backend.

```powershell
# Windows
cd C:\lendevent-dev\frontend
New-Item ".env" -ItemType File
```

```bash
# macOS/Linux
cd ~/lendevent-dev/frontend
touch .env
```

---

### Paso 4.3: Editar el Archivo .env del Frontend

Abre el archivo `.env` y agrega:

```dotenv
# ============================================
# CONFIGURACIÓN DEL FRONTEND
# ============================================

# URL del Backend
VITE_API_URL=http://localhost:8080

# Entorno
VITE_ENV=development

# Stripe (OPCIONAL)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

Guarda el archivo.

---

## ▶️ Fase 5: Ejecutar Ambos Proyectos

Ahora vamos a ejecutar el backend y frontend.

### Paso 5.1: Iniciar el Backend

En la terminal del backend:

```powershell
# Windows
cd C:\lendevent-dev\backend
npm run dev
```

```bash
# macOS/Linux
cd ~/lendevent-dev/backend
npm run dev
```

Deberías ver algo como:

```
✅ Server running on http://localhost:8080
✅ MongoDB connected successfully
📚 API Documentation: http://localhost:8080/docs
```

**¡No cierres esta ventana!** El backend debe seguir ejecutándose.

---

### Paso 5.2: Iniciar el Frontend

Abre una **nueva terminal**.

```powershell
# Windows
cd C:\lendevent-dev\frontend
npm run dev
```

```bash
# macOS/Linux
cd ~/lendevent-dev/frontend
npm run dev
```

Deberías ver algo como:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

### Paso 5.3: Acceder a la Aplicación

1. Abre tu navegador favorito (Chrome, Firefox, Safari, Edge)

2. Ve a: **http://localhost:5173**

3. Deberías ver la página de inicio de LendEvent

4. Para ingresar, usa:
   - Email: `admin@example.com`
   - Contraseña: `AdminSeguro123!`

---

### Paso 5.4: Verificar que Todo Funciona

**Checks del Backend:**
- Abre http://localhost:8080/health
- Deberías ver un JSON con estado "success"

**Checks del Frontend:**
- Accede a http://localhost:5173
- Loguearse debe funcionar
- Navegar por la app debe funcionar sin errores

---

## 🔍 Resumen de Carpetas Finales

```
C:\lendevent-dev\           (Windows)
~/lendevent-dev\            (macOS/Linux)
├── backend/
│   ├── node_modules/
│   ├── keys/               (claves JWT)
│   ├── .env                (configuración)
│   ├── package.json
│   └── src/
│
└── frontend/
    ├── node_modules/
    ├── .env                (configuración)
    ├── package.json
    ├── index.html
    └── src/
```

---

## 🆘 Solución de Problemas

### ❌ Error: "node: command not found" o "node is not recognized"

**Causa:** Node.js no está instalado o no está en el PATH

**Solución:**
1. Instala Node.js siguiendo el Paso 1.1
2. Cierra completamente PowerShell/Terminal
3. Abre una nueva ventana
4. Ejecuta `node --version` nuevamente

---

### ❌ Error: "MongoDB connection failed"

**Causa:** MongoDB no está corriendo

**Solución en Windows:**
1. Abre `Services` (Win + R → `services.msc`)
2. Busca "MongoDB Server"
3. Si no está en "Running", haz clic derecho → "Start"

**Solución en macOS:**
```bash
brew services start mongodb-community
```

**Solución en Linux:**
```bash
sudo systemctl start mongod
```

---

### ❌ Error: "Port 8080 already in use"

**Causa:** Algo ya está usando el puerto 8080

**Solución en Windows (PowerShell - como Admin):**
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

**Solución en macOS/Linux:**
```bash
lsof -i :8080
kill -9 <PID>
```

O simplemente cambia el puerto en el `.env`:
```dotenv
PORT=8081
```

---

### ❌ Error: "Cannot find module" o "npm ERR! code E404"

**Causa:** Las dependencias no se instalaron correctamente

**Solución:**
1. Elimina la carpeta `node_modules`
2. Ejecuta `npm install` nuevamente
3. Si falla, intenta: `npm cache clean --force`

```powershell
# Windows
rm -r node_modules
npm install
```

```bash
# macOS/Linux
rm -rf node_modules
npm install
```

---

### ❌ Error: "EACCES: permission denied" (en macOS/Linux)

**Causa:** Permisos de archivo

**Solución:**
```bash
sudo chown -R $(whoami) node_modules/
npm install
```

---

### ❌ Frontend no ve el Backend

**Causa:** `VITE_API_URL` no está correcto

**Solución:**
1. Abre `.env` del frontend
2. Verifica que dice: `VITE_API_URL=http://localhost:8080`
3. Reinicia el frontend: Ctrl+C y `npm run dev`

---

### ❌ Error de "CORS"

**Causa:** El backend no permite la URL del frontend

**Solución:**
1. Abre `.env` del backend
2. Verifica: `CORS_ORIGIN=https://app.test.local,http://localhost:3000,http://localhost:5173`
3. Reinicia el backend

---

### ❌ "Module not found" error al compilar

**Causa:** Falta instalar dependencias o versiones incompatibles

**Solución:**
```powershell
# Windows
npm install --legacy-peer-deps
```

```bash
# macOS/Linux
npm install --legacy-peer-deps
```

---

## 📱 Pantalla de Login Esperada

Una vez todo esté instalado, deberías ver:

```
┌─────────────────────────────────┐
│         LendEvent               │
│      Gestión de Alquileres      │
├─────────────────────────────────┤
│ Email:     [admin@example.com]  │
│ Contraseña: [••••••••]          │
│                                 │
│ [    Iniciar Sesión    ]        │
│                                 │
│ ¿No tienes cuenta?              │
│ Crear una nueva cuenta          │
└─────────────────────────────────┘
```

---

## ✅ Checklist Final

Antes de dar por completada la instalación, verifica:

- [ ] Node.js instalado (`node --version` funciona)
- [ ] Git instalado (`git --version` funciona)
- [ ] MongoDB corriendo (sin errores)
- [ ] Carpeta `backend` descargada en `C:\lendevent-dev\backend`
- [ ] Carpeta `frontend` descargada en `C:\lendevent-dev\frontend`
- [ ] Backend tiene `.env` configurado
- [ ] Frontend tiene `.env` configurado
- [ ] Backend tiene carpeta `keys/` con claves JWT
- [ ] Backend inicia sin errores en `http://localhost:8080`
- [ ] Frontend inicia sin errores en `http://localhost:5173`
- [ ] Puedes ver la página de login
- [ ] Puedes ingresar con `admin@example.com` y `AdminSeguro123!`

---

## 🚀 Próximos Pasos

Una vez que todo funcione:

1. **Explorar la aplicación** - Familiarízate con la interfaz
2. **Leer la documentación de API** - Ve a `backend/docs/API_DOCUMENTATION.md`
3. **Revisar el código** - Estructura en `backend/src/` y `frontend/src/`
4. **Hacer cambios** - Los cambios se actualizan automáticamente en desarrollo
5. **Crear nuevas funcionalidades** - Sigue los patrones existentes

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa la sección de Solución de Problemas** arriba
2. **Verifica los logs** del terminal (mensaje de error detallado)
3. **Revisa los archivos `.env`** - Asegúrate de que están correctos
4. **Prueba con MongoDB en terminal:**
   ```bash
   mongosh  # Debe conectarse sin errores
   ```

---

## 📚 Referencias Adicionales

- **Backend README:** `backend/README.md`
- **Frontend README:** `frontend/README.md`
- **API Documentation:** `backend/docs/API_DOCUMENTATION.md`
- **Permisos RBAC:** `backend/docs/PERMISSIONS_REFERENCE.md`
- **Variables de Entorno:** `.env` files (ver Fase 3 y 4)

---

## 🎉 ¡Listo!

Felicidades, ¡ya tienes LendEvent instalado y funcionando!

Ahora puedes:
- ✅ Crear categorías de materiales
- ✅ Gestionar inventario
- ✅ Crear solicitudes de préstamo
- ✅ Procesar pagos con Stripe
- ✅ Generar facturas
- ✅ Inspeccionar materiales
- ✅ Y mucho más...

**Hecho con ❤️ para la plataforma LendEvent**

---

**¿Necesitas ayuda?** Revisa la sección de Solución de Problemas o contacta al equipo de desarrollo.
