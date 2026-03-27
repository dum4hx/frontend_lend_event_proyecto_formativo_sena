# 🚀 LendEvent - Frontend

> Modern web frontend application for the event materials rental and management platform.

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Prerequisites](#-prerequisites)
- [Installation from Scratch](#-installation-from-scratch)
- [Project Installation](#-project-installation)
- [Environment Configuration](#-environment-configuration)
- [Running the Project](#️-running-the-project)
- [Project Structure](#-project-structure)
- [Backend Connection](#-backend-connection)
- [Available Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)
- [Recommendations](#-recommendations)

---

## 🎯 Introduction

### What is this project?

This is the **frontend** of LendEvent, a modern web application built with React 19, TypeScript and Vite.

### What does it do?

It's a **Single Page Application (SPA)** that allows:

- Manage event materials inventory (categories, types, instances)
- Administer customers, orders, contracts and rentals
- Control material transfers between multiple locations (warehouses)
- Manage work teams with customizable roles and permissions
- Visualize business reports and metrics
- Billing and payment tracking
- Multi-tenant subscription system (Starter, Professional, Enterprise)

### Application type

- **SPA (Single Page Application)** with React Router
- **Multi-role administrative dashboard** (Owner, Manager, Warehouse Operator, Commercial Advisor, Super Admin)
- **Multi-language** (Spanish/English)
- **Light/dark theme**
- **Modular architecture** with clear separation of layers (UI, Services, API)

---

## ⚙️ Prerequisites

To run this project you need:

- **Node.js** version 18 or higher (recommended: **v20.x or v22.x**)
- **npm** (included with Node.js)
- **Git** (optional, for cloning the repository)
- **Code editor** (recommended: VS Code)

---

## 🔧 Installation from Scratch

### Step 1: Install Node.js

#### On Windows:

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version (recommended: v20.x or higher)
3. Run the downloaded installer
4. Follow the installation wizard (leave default options)
5. Restart your terminal/command prompt

#### On macOS:

```bash
# Option 1: Download from nodejs.org
# Go to https://nodejs.org/ and download the installer

# Option 2: Using Homebrew (if you have it installed)
brew install node
```

#### On Linux (Ubuntu/Debian):

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify installation:

```bash
# Verify Node.js installed correctly
node -v
# Should show something like: v20.x.x

# Verify npm
npm -v
# Should show something like: 10.x.x
```

### Step 2: Install Git (Optional)

#### On Windows:

1. Download Git from [git-scm.com](https://git-scm.com/)
2. Run the installer
3. Leave default options

#### On macOS:

```bash
# Option 1: Homebrew
brew install git

# Option 2: Xcode Command Line Tools
xcode-select --install
```

#### On Linux:

```bash
sudo apt-get update
sudo apt-get install git
```

#### Verify installation:

```bash
git --version
# Should show: git version 2.x.x
```

### Step 3: Download the Project

#### Option A: With Git (recommended)

```bash
# Clone the repository
git clone <REPOSITORY_URL>

# Enter the project folder
cd Frontend_Lend\ Event
```

#### Option B: Manual download (without Git)

1. Download the project ZIP file from the repository
2. Extract the file to a folder of your choice
3. Open a terminal and navigate to that folder:

```bash
cd path/where/you/extracted/Frontend_Lend\ Event
```

---

## 📦 Project Installation

Once you have Node.js installed and the project downloaded:

```bash
# 1. Make sure you're in the project root folder
pwd
# You should see something like: /path/Frontend_Lend Event

# 2. Install all project dependencies
npm install

# This command may take 1-3 minutes depending on your connection
# You'll see a progress bar downloading packages
```

### What does `npm install` do?

- Reads the `package.json` file
- Downloads all necessary dependencies (~450 MB)
- Saves them in the `node_modules/` folder
- Generates a `package-lock.json` file with exact installed versions

### Main dependencies installed:

- **React 19.2.0** - User interface framework
- **TypeScript 5.9.3** - Typed language
- **Vite 7.2.5** - Ultra-fast bundler and development server
- **React Router 7.13.0** - SPA routing
- **Tailwind CSS 3.4.19** - Utility-first CSS framework
- **SWR 2.4.0** - Data fetching with cache
- **Lucide React** - Icon library
- **Vitest 4.0.18** - Testing framework
- And many more...

---

## 🔐 Environment Configuration

The project needs to configure environment variables to connect to the backend.

### Step 1: Create the `.env` file

```bash
# Copy the example file
cp .env.example .env

# On Windows (CMD):
copy .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

### Step 2: Edit the `.env` file

Open the `.env` file with your favorite text editor and you'll see:

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

### Available environment variables:

#### `VITE_API_BASE_URL` (REQUIRED)

**What is it?**  
The base URL of the backend server (REST API) that the frontend will connect to.

**What is it for?**  
Defines where the backend is running. All HTTP requests from the frontend will go to this URL.

**Common values:**

```env
# Local development (backend on your machine)
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Local development with custom domain
VITE_API_BASE_URL=https://api.test.local/api/v1

# Staging server
VITE_API_BASE_URL=https://api-staging.example.com/api/v1

# Production
VITE_API_BASE_URL=https://api.example.com/api/v1
```

**⚠️ IMPORTANT:**

- **DO NOT include trailing `/`** in the URL
- If the backend is not running, the frontend will show connection errors
- Ask the backend team for the correct URL

### Step 3: Verify configuration

The `.env` file should look like this (example for local development):

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## ▶️ Running the Project

### Development Mode

```bash
# Run the development server
npm run dev
```

**Expected result:**

```
VITE v7.2.5  ready in 543 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
➜  press h + enter to show help
```

### Access the application

1. Open your web browser
2. Go to the URL shown in your terminal (default: **http://localhost:5173**)
3. You should see the LendEvent home screen

### What happens when you run `npm run dev`?

- Vite starts a development server on port **5173**
- Code compiles automatically
- Changes reflect instantly in the browser (Hot Module Replacement)
- TypeScript checks for type errors in real time

### Stop the server

Press `Ctrl + C` in the terminal where it's running

---

## 📁 Project Structure

```
Frontend_Lend Event/
│
├── src/                           # Main source code
│   │
│   ├── App.tsx                    # Root component with all routes
│   ├── main.tsx                   # Application entry point
│   ├── index.css                  # Global styles (Tailwind CSS)
│   │
│   ├── assets/                    # Static resources (images, logos)
│   │
│   ├── components/                # Reusable components
│   │   ├── Header.tsx             # Top navigation bar
│   │   ├── Footer.tsx             # Footer
│   │   ├── LoginModal.tsx         # Login modal
│   │   ├── ui/                    # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── index.ts           # Exports all UI components
│   │   └── export/                # Data export components
│   │
│   ├── contexts/                  # React contexts (global state)
│   │   ├── AuthContext.tsx        # Authenticated user + permissions
│   │   ├── LanguageContext.tsx    # App language (ES/EN)
│   │   ├── ThemeContext.tsx       # Light/dark theme
│   │   └── ToastContext.tsx       # Toast notifications
│   │
│   ├── hooks/                     # Reusable custom hooks
│   │   ├── useAlertModal.tsx
│   │   ├── useApiQuery.ts
│   │   ├── useConfirmModal.tsx
│   │   └── useToast.ts
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── translations.ts
│   │   └── locales/
│   │       ├── en/                # English translations
│   │       └── es/                # Spanish translations
│   │
│   ├── lib/                       # Core utilities
│   │   ├── api.ts                 # ⭐ TYPED FETCH WRAPPER (key)
│   │   └── __tests__/
│   │
│   ├── modules/                   # Business domain modules
│   │   ├── app/                   # Main application module
│   │   │   ├── layouts/
│   │   │   ├── pages/             # 30+ pages
│   │   │   └── modules/           # Material sub-modules
│   │   └── super-admin/           # Platform administration
│   │
│   ├── pages/                     # Public pages (no auth)
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   │
│   ├── services/                  # ⭐ SERVICE LAYER (API calls)
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── materialService.ts
│   │   └── ... (20+ services)
│   │
│   ├── types/                     # TypeScript types
│   │   ├── api.ts                 # ⭐ API INTERFACES
│   │   └── export.ts
│   │
│   └── utils/                     # Helper utilities
│       ├── permissionGuard.tsx
│       └── subscriptionGuard.tsx
│
├── docs/                          # Project documentation
├── scripts/                       # Utility scripts
├── public/                        # Static assets
├── .env                           # Environment variables (DO NOT commit)
├── .env.example                   # Environment template
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

### Most important folders:

#### 📂 `src/lib/api.ts`

**The heart of backend communication.**  
`fetch` wrapper that:

- Handles all HTTP requests
- Automatically adds authentication cookies
- Automatically refreshes tokens when they expire (401)
- Handles errors consistently
- Includes retry logic for 5xx errors

#### 📂 `src/services/`

**Service layer.**  
Each file corresponds to a business domain. All functions are **fully typed** with interfaces from `src/types/api.ts`.

#### 📂 `src/types/api.ts`

**Single source of truth for TypeScript types.**  
Contains all interfaces that reflect backend data.

---

## 🔌 Backend Connection

### How does the frontend connect to the backend?

The frontend **does NOT use axios, direct fetch, or other HTTP libraries**.  
Everything goes through the typed wrapper in `src/lib/api.ts`.

### HTTP request flow:

```
Component React
    ↓
Service Layer (customerService.ts)
    ↓
API Wrapper (lib/api.ts)
    ↓
BACKEND API (HTTPS Request)
    ↓
API Wrapper (parses response)
    ↓
Component receives typed response
```

### Key file: `src/lib/api.ts`

This file exports functions for making HTTP requests:

```typescript
import { get, post, patch, del } from "../lib/api";

// GET request
const response = await get<DataType>("/endpoint");

// POST request
const response = await post<ResponseType, PayloadType>("/endpoint", payload);
```

### Where is the backend URL configured?

In the **`src/lib/api.ts`** file:

```typescript
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://api.test.local/api/v1";
```

This constant reads the `VITE_API_BASE_URL` environment variable you defined in the `.env` file.

### Authentication with HttpOnly cookies

The backend uses **HttpOnly cookies** to store authentication tokens:

- `access_token` (duration: 15 minutes)
- `refresh_token` (duration: 7 days)

**The frontend does NOT handle tokens manually.**  
The browser sends cookies automatically on each request because `api.ts` uses `credentials: 'include'`.

---

## 📜 Available Scripts

### 🚀 Development

#### `npm run dev`

Start the development server with hot reload on http://localhost:5173

#### `npm run preview`

Preview the production build locally

---

### 🏗️ Build

#### `npm run build`

Generate optimized production build in `dist/` folder

---

### 🧪 Testing

#### `npm run test`

Run all tests once (CI/CD)

#### `npm run test:watch`

Run tests in watch mode (development)

#### `npm run test:coverage`

Run tests with coverage report

---

### 🎨 Linting and Formatting

#### `npm run lint`

Check code errors with ESLint

#### `npm run format`

Format all code with Prettier

#### `npm run format:check`

Check formatting without modifying files

---

### 🌐 Translations

#### `npm run check:translations`

Verify all translation keys exist in ES and EN

#### `npm run generate:pending-translations`

Generate file with missing translations

#### `npm run update:translations`

Update translation files from pending-translations.json

---

## 🛠️ Troubleshooting

### ❌ Error: "command not found: npm"

**Cause:** Node.js is not installed or not in PATH.

**Solution:**

1. Verify installation: `node -v`
2. If not installed, go to [Installation from Scratch](#-installation-from-scratch)
3. Restart your terminal after installing

---

### ❌ Error running `npm install`

#### Problem: Permissions on Linux/macOS

```
EACCES: permission denied
```

**Solution:**

```bash
# DO NOT use sudo npm install (bad practice)
# Instead, change folder owner
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Problem: Corrupted cache

```bash
# Clean npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Error: "Port 5173 is already in use"

**Cause:** Another process is using port 5173.

**Solution:**

#### Option 1: Kill previous process

```bash
# On Linux/macOS
lsof -ti:5173 | xargs kill -9

# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

#### Option 2: Use another port

Edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000, // Change port
  },
});
```

---

### ❌ Error: "Failed to fetch" or "Network Error"

**Cause:** Frontend cannot connect to backend.

**Verifications:**

1. **Is the backend running?**

   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Is the URL in `.env` correct?**

   ```bash
   cat .env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **Did you restart the frontend after changing `.env`?**

   ```bash
   # Stop server (Ctrl+C)
   # Restart
   npm run dev
   ```

4. **CORS issues?**
   - Backend must allow requests from `http://localhost:5173`
   - Check CORS configuration in backend

---

### ❌ TypeScript error: "Cannot find module"

**Cause:** Incorrect import or moved file.

**Solution:**

```bash
# Clear TypeScript cache
rm -rf node_modules/.vite
npm run dev
```

## Environment variables

| Variable            | Description                        | Default                         |
| ------------------- | ---------------------------------- | ------------------------------- |
| `VITE_API_BASE_URL` | Base URL of the LendEvent REST API | `https://api.test.local/api/v1` |

> Create a `.env` file in the project root (see `.env.example`).

## Available scripts

| Script                  | Purpose                               |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Start Vite dev server with HMR        |
| `npm run build`         | Type-check & production build         |
| `npm run lint`          | Run ESLint across the project         |
| `npm run format`        | Format all source files with Prettier |
| `npm run format:check`  | Check formatting without writing      |
| `npm run test`          | Run all tests once (Vitest)           |
| `npm run test:watch`    | Run tests in watch mode               |
| `npm run test:coverage` | Run tests with V8 coverage report     |
| `npm run preview`       | Preview the production build locally  |

## Architecture highlights

- **Typed fetch wrapper** — `src/lib/api.ts`. Every HTTP call goes through this module (no axios/ky). It handles JSON serialisation, query params, `credentials: 'include'`, error parsing, and automatic 401 → token refresh.
- **Domain services** — `src/services/*.ts`. One file per domain entity (users, customers, materials, loans …). Each function is fully typed with interfaces from `src/types/api.ts`.
- **API types** — `src/types/api.ts`. TypeScript interfaces derived directly from `API_DOCUMENTATION.md`.
- **Auth via HttpOnly cookies** — the backend sets `access_token` (15 min) and `refresh_token` (7 days) as HttpOnly cookies. The frontend never touches `localStorage` for tokens.

## Testing

Tests use **Vitest** + **MSW** (Mock Service Worker).

```bash
npm test               # single run
npm run test:watch     # interactive watch mode
npm run test:coverage  # coverage report
```

Test files live beside their module: `src/lib/__tests__/api.test.ts`, `src/services/__tests__/authService.test.ts`.

## PR checklist

Before requesting a review, ensure every item is checked:

- [ ] **Types** — no `any`; all new code uses interfaces from `src/types/api.ts`.
- [ ] **Fetch wrapper** — all HTTP calls go through `src/lib/api.ts` (no raw `fetch`, no axios).
- [ ] **Error handling** — callers catch `ApiError` (instanceof check), never inspect `response.status === 'error'`.
- [ ] **English comments** — code comments and docstrings are in English.
- [ ] **Environment vars** — any new env var is added to both `.env.example` and this README.
- [ ] **Tests pass** — `npm test` exits 0.
- [ ] **Lint clean** — `npm run lint` exits 0.
- [ ] **Format check** — `npm run format:check` exits 0.
- [ ] **No console.log** — remove debugging logs before pushing.
- [ ] **Reviewed on mobile** — responsive layout has not regressed (if applicable).

## Export Service

Client-side data export with redaction, audit metadata, and pluggable format adapters.

### Quick usage

```ts
import { exportService, PLAN_CONFIGURATION_POLICY } from "./services/export";
import type { ExportConfig } from "./types/export";

const config: ExportConfig = {
  format: "xlsx",
  module: "plan-configuration",
  selectedFields: ["plan", "displayName", "baseCost", "status"],
  includeAuditMetadata: true,
  fullExport: false,
};

const result = await exportService.export(rawData, config, userId);
```

### Architecture

| Layer         | File                                           | Responsibility                                     |
| ------------- | ---------------------------------------------- | -------------------------------------------------- |
| Types         | `src/types/export.ts`                          | All export-related TypeScript interfaces           |
| Redaction     | `src/services/export/redaction.ts`             | PII pseudonymization/exclusion policies per module |
| Validation    | `src/services/export/validation.ts`            | Runtime payload validation                         |
| Checksum      | `src/services/export/checksum.ts`              | SHA-256 hashing via Web Crypto API                 |
| PDF Adapter   | `src/services/export/adapters/pdfAdapter.ts`   | Minimal PDF-1.4 generator (no dependencies)        |
| Excel Adapter | `src/services/export/adapters/excelAdapter.ts` | Minimal XLSX generator (no dependencies)           |
| Service       | `src/services/export/exportService.ts`         | Orchestrates redaction → validation → adapter      |

### Redaction policies

Each module has a default `RedactionPolicy` defining per-field actions:

- **include** — value exported as-is
- **hash** — replaced with a 16-char SHA-256 pseudonym
- **exclude** — omitted from export (PII protection)
- **mask** — partially masked (e.g., `j***@e***.com`)

Full export (PII included) requires explicit user confirmation and is logged in audit metadata.

### AlertCard component

Reusable alert notification with neon styling:

```tsx
import { AlertContainer } from "./components/ui";
import { useAlerts } from "./hooks/useAlerts";

const { alerts, showAlert, dismissAlert } = useAlerts();
showAlert("success", "Export completed!");

<AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />;
```

### Demo page

Visit `/export-demo` for a manual QA page exercising exports and alert cards.
