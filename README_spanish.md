# 🚀 LendEvent - Frontend

> Aplicación web frontend para la plataforma de gestión de alquiler de materiales y equipos para eventos corporativos.

## 📋 Tabla de Contenidos

- [Introducción](#-introducción)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación desde Cero](#-instalación-desde-cero)
- [Instalación del Proyecto](#-instalación-del-proyecto)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Ejecución del Proyecto](#-ejecución-del-proyecto)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Conexión con el Backend](#-conexión-con-el-backend)
- [Scripts Disponibles](#-scripts-disponibles)
- [Solución de Problemas](#-solución-de-problemas)
- [Recomendaciones](#-recomendaciones)

---

## 🎯 Introducción

### ¿Qué es este proyecto?

Este es el **frontend** de LendEvent, una aplicación web moderna construida con React 19, TypeScript y Vite.

### ¿Qué hace?

Es una **Single Page Application (SPA)** que permite:

- Gestionar inventario de materiales para eventos (categorías, tipos, instancias)
- Administrar clientes, pedidos, contratos y rentas
- Controlar transferencias de materiales entre múltiples ubicaciones (warehouses)
- Gestionar equipos de trabajo con roles y permisos personalizables
- Visualizar reportes y métricas de negocio
- Facturación y seguimiento de pagos
- Sistema de suscripciones multi-tenant (Starter, Professional, Enterprise)

### Tipo de aplicación

- **SPA (Single Page Application)** con React Router
- **Dashboard administrativo** multi-rol (Owner, Manager, Warehouse Operator, Commercial Advisor, Super Admin)
- **Multi-idioma** (Español/Inglés)
- **Tema claro/oscuro**
- **Arquitectura modular** con separación clara de capas (UI, Services, API)

---

## ⚙️ Requisitos Previos

Para ejecutar este proyecto necesitas:

- **Node.js** versión 18 o superior (recomendado: **v20.x o v22.x**)
- **npm** (incluido con Node.js)
- **Git** (opcional, para clonar el repositorio)
- **Editor de código** (recomendado: VS Code)

---

## 🔧 Instalación desde Cero

### Paso 1: Instalar Node.js

#### En Windows:

1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión **LTS (Long Term Support)** (recomendada: v20.x o superior)
3. Ejecuta el instalador descargado
4. Sigue el asistente de instalación (deja las opciones por defecto)
5. Reinicia tu terminal/símbolo del sistema

#### En macOS:

```bash
# Opción 1: Descarga desde nodejs.org
# Ve a https://nodejs.org/ y descarga el instalador

# Opción 2: Usando Homebrew (si lo tienes instalado)
brew install node
```

#### En Linux (Ubuntu/Debian):

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verificar instalación:

```bash
# Verifica que Node.js se instaló correctamente
node -v
# Debería mostrar algo como: v20.x.x

# Verifica npm
npm -v
# Debería mostrar algo como: 10.x.x
```

### Paso 2: Instalar Git (Opcional)

#### En Windows:

1. Descarga Git desde [git-scm.com](https://git-scm.com/)
2. Ejecuta el instalador
3. Deja las opciones por defecto

#### En macOS:

```bash
# Opción 1: Homebrew
brew install git

# Opción 2: Xcode Command Line Tools
xcode-select --install
```

#### En Linux:

```bash
sudo apt-get update
sudo apt-get install git
```

#### Verificar instalación:

```bash
git --version
# Debería mostrar: git version 2.x.x
```

### Paso 3: Descargar el Proyecto

#### Opción A: Con Git (recomendado)

```bash
# Clona el repositorio
git clone <URL_DEL_REPOSITORIO>

# Entra a la carpeta del proyecto
cd Frontend_Lend\ Event
```

#### Opción B: Descarga manual (sin Git)

1. Descarga el archivo ZIP del proyecto desde el repositorio
2. Descomprime el archivo en una carpeta de tu elección
3. Abre una terminal y navega a esa carpeta:

```bash
cd ruta/donde/descomprimiste/Frontend_Lend\ Event
```

---

## 📦 Instalación del Proyecto

Una vez que tienes Node.js instalado y el proyecto descargado:

```bash
# 1. Asegúrate de estar en la carpeta raíz del proyecto
pwd
# Deberías ver algo como: /ruta/Frontend_Lend Event

# 2. Instala todas las dependencias del proyecto
npm install

# Este comando puede tardar 1-3 minutos dependiendo de tu conexión
# Verás una barra de progreso descargando paquetes
```

### ¿Qué hace `npm install`?

- Lee el archivo `package.json`
- Descarga todas las dependencias necesarias (~450 MB)
- Las guarda en la carpeta `node_modules/`
- Genera un archivo `package-lock.json` con las versiones exactas instaladas

### Dependencias principales que se instalan:

- **React 19.2.0** - Framework de interfaz de usuario
- **TypeScript 5.9.3** - Lenguaje tipado
- **Vite 7.2.5** - Bundler y servidor de desarrollo ultra-rápido
- **React Router 7.13.0** - Enrutamiento SPA
- **Tailwind CSS 3.4.19** - Framework CSS utility-first
- **SWR 2.4.0** - Data fetching con cache
- **Lucide React** - Librería de íconos
- **Vitest 4.0.18** - Framework de testing
- Y muchas más...

---

## 🔐 Configuración del Entorno

El proyecto necesita configurar variables de entorno para conectarse al backend.

### Paso 1: Crear el archivo `.env`

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# En Windows (CMD):
copy .env.example .env

# En Windows (PowerShell):
Copy-Item .env.example .env
```

### Paso 2: Editar el archivo `.env`

Abre el archivo `.env` con tu editor de texto favorito y verás:

```env
# ──────────────────────────────────────────────
# LendEvent Frontend – Environment Variables
# ──────────────────────────────────────────────
# Vite exposes variables prefixed with VITE_ to the client bundle.
# NEVER put secrets (API keys, tokens) here – they are visible in the browser.

# Base URL of the LendEvent REST API (no trailing slash).
# Examples:
#   Local dev  → https://api.test.local/api/v1
#   Staging    → https://api-staging.lendevent.com/api/v1
#   Production → https://api.lendevent.com/api/v1
VITE_API_BASE_URL=https://api.test.local/api/v1
```

### Variables de entorno disponibles:

#### `VITE_API_BASE_URL` (OBLIGATORIA)

**¿Qué es?**  
La URL base del servidor backend (API REST) al que el frontend se conectará.

**¿Para qué sirve?**  
Define dónde está corriendo el backend. Todas las peticiones HTTP del frontend irán a esta URL.

**Valores comunes:**

```env
# Desarrollo local (backend en tu máquina)
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Desarrollo local con dominio personalizado
VITE_API_BASE_URL=https://api.test.local/api/v1

# Servidor de staging
VITE_API_BASE_URL=https://api-staging.example.com/api/v1

# Producción
VITE_API_BASE_URL=https://api.example.com/api/v1
```

**⚠️ IMPORTANTE:**
- **NO incluyas barra `/` al final** de la URL
- Si el backend no está corriendo, el frontend mostrará errores de conexión
- Pregunta al equipo de backend cuál es la URL correcta

### Paso 3: Verificar la configuración

El archivo `.env` debe quedar así (ejemplo para desarrollo local):

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## ▶️ Ejecución del Proyecto

### Modo Desarrollo

```bash
# Ejecuta el servidor de desarrollo
npm run dev
```

**Resultado esperado:**

```
VITE v7.2.5  ready in 543 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
➜  press h + enter to show help
```

### Acceder a la aplicación

1. Abre tu navegador web
2. Ve a la URL que aparece en tu terminal (por defecto: **http://localhost:5173**)
3. Deberías ver la pantalla de inicio de LendEvent

### ¿Qué pasa cuando ejecutas `npm run dev`?

- Vite inicia un servidor de desarrollo en el puerto **5173**
- El código se compila automáticamente
- Los cambios se reflejan instantáneamente en el navegador (Hot Module Replacement)
- TypeScript verifica errores de tipos en tiempo real

### Detener el servidor

Presiona `Ctrl + C` en la terminal donde está corriendo

---

## 📁 Estructura del Proyecto

```
Frontend_Lend Event/
│
├── src/                           # Código fuente principal
│   │
│   ├── App.tsx                    # Componente raíz con todas las rutas
│   ├── main.tsx                   # Punto de entrada de la aplicación
│   ├── index.css                  # Estilos globales (Tailwind CSS)
│   │
│   ├── assets/                    # Recursos estáticos (imágenes, logos)
│   │
│   ├── components/                # Componentes reutilizables
│   │   ├── Header.tsx             # Barra de navegación superior
│   │   ├── Footer.tsx             # Pie de página
│   │   ├── LoginModal.tsx         # Modal de inicio de sesión
│   │   ├── ui/                    # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── index.ts           # Exporta todos los componentes UI
│   │   └── export/                # Componentes para exportación de datos
│   │
│   ├── contexts/                  # Contextos de React (estado global)
│   │   ├── AuthContext.tsx        # Usuario autenticado + permisos
│   │   ├── LanguageContext.tsx    # Idioma de la aplicación (ES/EN)
│   │   ├── ThemeContext.tsx       # Tema claro/oscuro
│   │   └── ToastContext.tsx       # Notificaciones toast
│   │
│   ├── hooks/                     # Custom hooks reutilizables
│   │   ├── useAlertModal.tsx
│   │   ├── useApiQuery.ts
│   │   ├── useConfirmModal.tsx
│   │   └── useToast.ts
│   │
│   ├── i18n/                      # Internacionalización
│   │   ├── translations.ts
│   │   └── locales/
│   │       ├── en/                # Traducciones en inglés
│   │       └── es/                # Traducciones en español
│   │
│   ├── lib/                       # Utilidades core
│   │   ├── api.ts                 # ⭐ WRAPPER DE FETCH TIPADO (clave)
│   │   └── __tests__/
│   │
│   ├── modules/                   # Módulos por dominio de negocio
│   │   ├── app/                   # Módulo principal de la aplicación
│   │   │   ├── layouts/
│   │   │   ├── pages/             # 30+ páginas
│   │   │   └── modules/           # Sub-módulos de materiales
│   │   └── super-admin/           # Administración de plataforma
│   │
│   ├── pages/                     # Páginas públicas (sin autenticación)
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   │
│   ├── services/                  # ⭐ CAPA DE SERVICIOS (llamadas a la API)
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── materialService.ts
│   │   └── ... (20+ servicios)
│   │
│   ├── types/                     # Tipos TypeScript
│   │   ├── api.ts                 # ⭐ INTERFACES DE LA API
│   │   └── export.ts
│   │
│   └── utils/                     # Utilidades helpers
│       ├── permissionGuard.tsx
│       └── subscriptionGuard.tsx
│
├── docs/                          # Documentación del proyecto
├── scripts/                       # Scripts de utilidad
├── public/                        # Assets estáticos
├── .env                           # Variables de entorno (NO subir a Git)
├── .env.example                   # Plantilla de variables de entorno
├── package.json                   # Dependencias y scripts
├── vite.config.ts                 # Configuración de Vite
├── tailwind.config.js             # Configuración de Tailwind CSS
└── tsconfig.json                  # Configuración de TypeScript
```

### Carpetas más importantes:

#### 📂 `src/lib/api.ts`
**El corazón de la comunicación con el backend.**  
Wrapper de `fetch` que:
- Maneja todas las peticiones HTTP
- Añade automáticamente cookies de autenticación
- Refresca tokens automáticamente cuando expiran (401)
- Maneja errores de forma consistente
- Incluye retry logic para errores 5xx

#### 📂 `src/services/`
**Capa de servicios.**  
Cada archivo corresponde a un dominio de negocio. Todas las funciones están **completamente tipadas** con interfaces de `src/types/api.ts`.

#### 📂 `src/types/api.ts`
**Single source of truth para tipos TypeScript.**  
Contiene todas las interfaces que reflejan los datos del backend.

---

## 🔌 Conexión con el Backend

### ¿Cómo se conecta el frontend con el backend?

El frontend **NO usa axios, fetch directo, ni otras librerías HTTP**.  
Todo pasa por el wrapper tipado en `src/lib/api.ts`.

### Flujo de una petición HTTP:

```
Componente React
    ↓
Service Layer (customerService.ts)
    ↓
API Wrapper (lib/api.ts)
    ↓
BACKEND API (Petición HTTPS)
    ↓
API Wrapper (parsea respuesta)
    ↓
Componente recibe respuesta tipada
```

### Archivo clave: `src/lib/api.ts`

Este archivo exporta funciones para hacer peticiones HTTP:

```typescript
import { get, post, patch, del } from '../lib/api';

// GET request
const response = await get<DataType>('/endpoint');

// POST request
const response = await post<ResponseType, PayloadType>('/endpoint', payload);
```

### ¿Dónde se configura la URL del backend?

En el archivo **`src/lib/api.ts`**:

```typescript
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://api.test.local/api/v1";
```

Esta constante lee la variable de entorno `VITE_API_BASE_URL` que definiste en el archivo `.env`.

### Autenticación con cookies HttpOnly

El backend usa **cookies HttpOnly** para guardar los tokens de autenticación:

- `access_token` (duración: 15 minutos)
- `refresh_token` (duración: 7 días)

**El frontend NO maneja tokens manualmente.**  
El navegador envía las cookies automáticamente en cada petición porque `api.ts` usa `credentials: 'include'`.

---

## 📜 Scripts Disponibles

### 🚀 Desarrollo

#### `npm run dev`
Inicia el servidor de desarrollo con hot reload en http://localhost:5173

#### `npm run preview`
Previsualiza el build de producción localmente

---

### 🏗️ Build

#### `npm run build`
Genera el build de producción optimizado en la carpeta `dist/`

---

### 🧪 Testing

#### `npm run test`
Ejecuta todos los tests una vez (CI/CD)

#### `npm run test:watch`
Ejecuta tests en modo watch (desarrollo)

#### `npm run test:coverage`
Ejecuta tests con reporte de cobertura

---

### 🎨 Linting y Formato

#### `npm run lint`
Verifica errores de código con ESLint

#### `npm run format`
Formatea todo el código con Prettier

#### `npm run format:check`
Verifica formato sin modificar archivos

---

### 🌐 Traducciones

#### `npm run check:translations`
Verifica que todas las claves de traducción existan en ES y EN

#### `npm run generate:pending-translations`
Genera archivo con traducciones faltantes

#### `npm run update:translations`
Actualiza archivos de traducción desde pending-translations.json

---

## 🛠️ Solución de Problemas

### ❌ Error: "command not found: npm"

**Causa:** Node.js no está instalado o no está en el PATH.

**Solución:**
1. Verifica instalación: `node -v`
2. Si no está instalado, ve a [Instalación desde Cero](#-instalación-desde-cero)
3. Reinicia tu terminal después de instalar

---

### ❌ Error al ejecutar `npm install`

#### Problema: Permisos en Linux/macOS

```
EACCES: permission denied
```

**Solución:**

```bash
# NO uses sudo npm install (mala práctica)
# En su lugar, cambia el propietario de la carpeta
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Problema: Caché corrupto

```bash
# Limpia caché de npm
npm cache clean --force

# Borra node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Error: "Port 5173 is already in use"

**Causa:** Otro proceso está usando el puerto 5173.

**Solución:**

#### Opción 1: Matar el proceso anterior

```bash
# En Linux/macOS
lsof -ti:5173 | xargs kill -9

# En Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

#### Opción 2: Usar otro puerto

Edita `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000, // Cambia el puerto
  },
});
```

---

### ❌ Error: "Failed to fetch" o "Network Error"

**Causa:** El frontend no puede conectarse al backend.

**Verificaciones:**

1. **¿El backend está corriendo?**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **¿La URL en `.env` es correcta?**
   ```bash
   cat .env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **¿Reiniciaste el frontend después de cambiar `.env`?**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Vuelve a iniciar
   npm run dev
   ```

4. **¿Hay problemas de CORS?**
   - El backend debe permitir requests desde `http://localhost:5173`
   - Verifica la configuración de CORS en el backend

---

### ❌ Error de TypeScript: "Cannot find module"

**Causa:** Importación incorrecta o archivo movido.

**Solución:**

```bash
# Limpia caché de TypeScript
rm -rf node_modules/.vite
npm run dev
```

---

### ❌ La aplicación se ve sin estilos

**Causa:** Tailwind CSS no se cargó correctamente.

**Solución:**

```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install

# Verifica que index.css importa Tailwind
cat src/index.css
# Debe contener: @tailwind base; @tailwind components; @tailwind utilities;
```

---

## 💡 Recomendaciones

### 🔒 Seguridad

#### ❌ NO subas el archivo `.env` a Git

```bash
# Verifica que .env esté en .gitignore
cat .gitignore | grep .env
# Debe aparecer: .env
```

#### ❌ NO pongas secretos en `.env`

Las variables `VITE_` se empaquetan en el bundle del cliente y son **visibles en el navegador**.

**NUNCA pongas:**
- API keys
- Contraseñas
- Tokens de autenticación
- Secrets de terceros

#### ✅ Usa HTTPS en producción

```env
# ❌ NO en producción
VITE_API_BASE_URL=http://api.example.com/api/v1

# ✅ SÍ en producción
VITE_API_BASE_URL=https://api.example.com/api/v1
```

---

### 📝 Buenas Prácticas

#### 1. **Mantén dependencias actualizadas**

```bash
# Verifica dependencias desactualizadas
npm outdated

# Actualiza dependencias (con cuidado)
npm update
```

#### 2. **Ejecuta linter antes de cada commit**

```bash
npm run lint
npm run format
```

#### 3. **Ejecuta tests antes de hacer PR**

```bash
npm run test
```

#### 4. **Verifica errores de TypeScript**

```bash
npx tsc --noEmit
```

#### 5. **Usa ramas para nuevas features**

```bash
git checkout -b feature/nueva-funcionalidad
# Trabaja en tu feature
git add .
git commit -m "feat: descripción de la feature"
git push origin feature/nueva-funcionalidad
```

---

### 🚀 Performance

#### 1. **Usa producción para medir performance**

```bash
npm run build
npm run preview
```

El build de desarrollo (`npm run dev`) es **más lento** porque incluye:
- Source maps completos
- Sin minificación
- Sin tree-shaking

#### 2. **Lazy loading de módulos**

El proyecto ya usa lazy loading para el módulo Super Admin.

---

### 📚 Recursos Útiles

- **Documentación de React:** https://react.dev/
- **Documentación de Vite:** https://vitejs.dev/
- **Documentación de TypeScript:** https://www.typescriptlang.org/
- **Documentación de Tailwind CSS:** https://tailwindcss.com/
- **Documentación de React Router:** https://reactrouter.com/
- **Documentación de SWR:** https://swr.vercel.app/

---

### 🆘 ¿Necesitas ayuda?

Si tienes problemas:

1. Revisa la [Solución de Problemas](#-solución-de-problemas)
2. Busca en la documentación del proyecto (`docs/`)
3. Revisa los logs en la consola del navegador (F12)
4. Verifica los logs del servidor de desarrollo en la terminal
5. Contacta al equipo de desarrollo

---

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

---

**¡Listo! Ahora tienes el frontend de LendEvent corriendo correctamente. 🎉**
