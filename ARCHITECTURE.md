# 🏗️ Arquitectura del Sistema - Visión General

## Estructura Funcional Completa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)                         │
│                  c:\Users\duvil\Frontend_Lend Event                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOGIN & AUTHENTICATION                             │
│                                                                               │
│  ┌──────────────────────────┐      ┌──────────────────────────┐            │
│  │   Login (Login.tsx)      │      │  SignUp (SignUp.tsx)     │            │
│  │  - Email/Password entry  │      │  - User registration     │            │
│  │  - JWT token storage     │      │  - Auto-login after reg  │            │
│  └──────────────────────────┘      └──────────────────────────┘            │
│                 │                              │                            │
│                 └──────────┬──────────────────┘                            │
│                            ▼                                               │
│                    ┌────────────────────┐                                 │
│                    │   AuthContext      │                                 │
│                    │ - user data        │                                 │
│                    │ - user role        │                                 │
│                    │ - JWT token        │                                 │
│                    └────────────────────┘                                 │
│                            │                                               │
└────────────────────────────┼───────────────────────────────────────────────┘
                             │
              ┌──────────────┴───────────────┬──────────────┐
              ▼                              ▼              ▼
      ┌─────────────────┐        ┌─────────────────┐  ┌──────────────┐
      │   Owner Role    │        │  Manager Role   │  │ Commercial   │
      │   (/admin)      │        │ (/location-mgr) │  │  Advisor     │
      │                 │        │                 │  │  (/com-adv)  │
      │ - Dashboard     │        │ - Dashboard     │  │              │
      │ - Settings      │        │ - Materials     │  │ - Dashboard  │
      │                 │        │ - Categories    │  │ - Customers  │
      └─────────────────┘        │ - Models        │  │ - Orders     │
                                 │ - Attributes    │  │ - Contracts  │
      ┌─────────────────┐        │ - Plans         │  │ - Rentals    │
      │ Warehouse Op.   │        │ - Settings      │  │ - Invoices   │
      │ (/warehouse-op) │        │                 │  │ - Reports    │
      │                 │        └─────────────────┘  │ - Settings   │
      │ - Dashboard     │                             └──────────────┘
      │ - Inventory     │        ┌─────────────────┐
      │ - Locations     │        │  Super Admin    │
      │ - Movements     │        │  (/super-admin) │
      │ - Alerts        │        │                 │
      │ - Settings      │        │ - Full access   │
      │                 │        │ - System mgmt   │
      └─────────────────┘        └─────────────────┘
```

---

## Flujo de Datos en una Acción CRUD

```
USER ACTION (Click "Add Material")
        │
        ▼
    ┌─────────────────────────────────┐
    │ React Component (Materials.tsx) │
    │ - handleCreate(newData)         │
    └─────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │ Service Layer                       │
    │ locationManagerService.createMaterial()  │
    └─────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │ API Wrapper (lib/api.ts)            │
    │ - apiCall.post('/api/materials')    │
    │ - Add Authorization header          │
    └─────────────────────────────────────┘
        │
        ▼
    ┌────────────────────────────┐
    │ Backend Server             │      Currently Mock Data
    │ POST /api/materials        │◄─────── Will integrate with real API
    │ - Validate data            │
    │ - Save to database         │
    │ - Return new material      │
    └────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │ Response (ApiSuccessResponse)       │
    │ {                                   │
    │   "success": true,                 │
    │   "data": { newMaterial }          │
    │ }                                   │
    └─────────────────────────────────────┘
        │
        ▼
    ┌─────────────────────────────────────┐
    │ Update Component State              │
    │ setMaterials([...prev, newData])    │
    │ Show success message                │
    └─────────────────────────────────────┘
        │
        ▼
    UI UPDATED (New material in list)
```

---

## Estructura de Directorios Detallada

```
src/
│
├── App.tsx ◄─── ROUTER PRINCIPAL (49 rutas)
│   ├── Lazy import de admin module
│   ├── Lazy import de warehouse-operator module
│   ├── Lazy import de location-manager module
│   ├── Lazy import de commercial-advisor module
│   └── Lazy import de super-admin module
│
├── main.tsx ◄─── PUNTO DE ENTRADA
│
├── components/
│   ├── Header.tsx (Navbar con logo/logout)
│   ├── Footer.tsx (Footer componente)
│   ├── LoginModal.tsx (Modal para login)
│   ├── ui/ (Componentes reutilizables)
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorDisplay.tsx
│   │   ├── AlertModal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── AlertCard.tsx
│   │   └── EmptyState.tsx
│   └── export/
│       └── ExportSettingsModal.tsx
│
├── contexts/
│   ├── AuthContext.tsx (Proveedor de autenticación)
│   └── useAuth.ts (Hook para acceder a datos de usuario)
│
├── hooks/ (Composables lógica personalizada)
│   ├── useAuth.ts (Acceso a autenticación)
│   ├── useAlerts.ts (Gestión de alertas)
│   ├── useAlertModal.tsx (Modal de alertas)
│   ├── useApiQuery.ts (Fetch de datos)
│   └── useLogout.ts (Logout)
│
├── lib/
│   ├── api.ts ◄─── WRAPPER DE API (Maneja JWT, errores)
│   └── __tests__/
│       └── api.test.ts
│
├── modules/ ◄─── MÓDULOS POR ROL
│   │
│   ├── admin/ (Owner - Propietario)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── EventCard.tsx
│   │   ├── layouts/
│   │   │   └── AdminLayout.tsx (Sidebar + Outlet)
│   │   └── pages/
│   │       ├── AdminDashboard.tsx
│   │       ├── Customers.tsx
│   │       ├── MyEvents.tsx
│   │       ├── Team.tsx
│   │       ├── SubscriptionManagement.tsx
│   │       ├── IA_Settings.tsx
│   │       └── Settings.tsx
│   │
│   ├── warehouse-operator/ ◄─── OPERADOR DE ALMACÉN
│   │   ├── components/
│   │   │   ├── Sidebar.tsx (6 items)
│   │   │   └── StatCard.tsx
│   │   ├── layouts/
│   │   │   └── WarehouseOperatorLayout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Locations.tsx
│   │   │   ├── StockMovements.tsx
│   │   │   ├── Alerts.tsx
│   │   │   └── Settings.tsx
│   │   └── services/
│   │       └── warehouseOperatorService.ts
│   │
│   ├── location-manager/ ◄─── GERENTE DE SEDE ✅ NUEVO
│   │   ├── components/
│   │   │   ├── Sidebar.tsx (7 items)
│   │   │   ├── StatCard.tsx
│   │   │   └── index.ts
│   │   ├── layouts/
│   │   │   └── LocationManagerLayout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx (Stats + Activity)
│   │   │   ├── Materials.tsx (Table + Search)
│   │   │   ├── Categories.tsx (Card Grid)
│   │   │   ├── Models.tsx (Table)
│   │   │   ├── Attributes.tsx (List + Adoption)
│   │   │   ├── Plans.tsx (Card Grid)
│   │   │   └── Settings.tsx (Preferences)
│   │   └── services/
│   │       └── locationManagerService.ts (CRUD x5 entities)
│   │
│   ├── commercial-advisor/ ◄─── ASESOR COMERCIAL ✅ NUEVO
│   │   ├── components/
│   │   │   ├── Sidebar.tsx (8 items)
│   │   │   ├── StatCard.tsx
│   │   │   └── index.ts
│   │   ├── layouts/
│   │   │   └── CommercialAdvisorLayout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx (KPIs + Orders)
│   │   │   ├── Customers.tsx (Card Grid)
│   │   │   ├── Orders.tsx (Table + Filter)
│   │   │   ├── Contracts.tsx (Card View)
│   │   │   ├── Rentals.tsx (Rental Tracking)
│   │   │   ├── Invoices.tsx (Payment Tracking)
│   │   │   ├── Reports.tsx (Analytics)
│   │   │   └── Settings.tsx (Profile)
│   │   └── services/
│   │       └── commercialAdvisorService.ts (CRUD x5 entities)
│   │
│   └── super-admin/ (Administrador del Sistema)
│       ├── components/
│       ├── layouts/
│       └── pages/
│
├── pages/ (Páginas Públicas)
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── PasswordRecovery.tsx
│   ├── Packages.tsx
│   ├── Dashboard.tsx
│   ├── Checkout.tsx
│   ├── CheckoutSuccess.tsx
│   ├── AcceptInvite.tsx
│   ├── AboutUs.tsx
│   ├── ExportDemo.tsx
│   ├── NotFound.tsx
│   └── Unauthorized.tsx
│
├── services/ ◄─── SERVICIOS API (Mock Data)
│   ├── authService.ts (Autenticación)
│   ├── locationManagerService.ts ✅ NUEVO (Material catalog)
│   ├── commercialAdvisorService.ts ✅ NUEVO (Sales operations)
│   ├── warehouseOperatorService.ts (Inventory management)
│   ├── adminService.ts
│   ├── customerService.ts
│   ├── billingService.ts
│   ├── subscriptionTypeService.ts
│   ├── userService.ts
│   ├── organizationService.ts
│   ├── loanService.ts
│   ├── materialService.ts
│   ├── inspectionService.ts
│   ├── invoiceService.ts
│   ├── superAdminService.ts
│   ├── adminAnalyticsService.ts
│   ├── export/ (Servicios de exportación)
│   │   ├── exportService.ts
│   │   ├── validation.ts
│   │   ├── redaction.ts
│   │   ├── checksum.ts
│   │   └── adapters/
│   └── __tests__/
│
├── test/
│   ├── setup.ts (Configuración de testing)
│   └── mocks/
│       ├── server.ts (MSW server)
│       └── handlers.ts (Handlers mock)
│
├── types/
│   ├── api.ts (Tipos de API)
│   └── export.ts (Tipos de exportación)
│
├── utils/
│   ├── errorHandling.ts (Manejo de errores)
│   ├── roleGuard.tsx (Protección de roles)
│   ├── subscriptionGuard.tsx (Protección de suscripción)
│   └── validators.ts (Validadores)
│
└── assets/ (Imágenes, iconos)
```

---

## Flujo de Autenticación y Autorización

```
┌──────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ACCESO AL SISTEMA                        │
└──────────────────────────────────────────────────────────────────────┘

1. PÁGINA PÚBLICA
   ├─ Login (sin protección)
   ├─ SignUp (sin protección)
   ├─ Packages (sin protección)
   └─ AboutUs (sin protección)

2. LOGIN EXITOSO
   │
   ├─ Credenciales enviadas a /api/auth/login
   ├─ Backend valida y retorna JWT + User data
   ├─ AuthContext almacena token + user info
   └─ localStorage.setItem('token') para persistencia

3. REDIRECCIÓN A DASHBOARD
   │
   ├─ Login redirige a: getDashboardUrlByRole(user.role)
   │
   ├─ SI owner → /admin
   ├─ SI manager → /location-manager
   ├─ SI warehouse_operator → /warehouse-operator
   ├─ SI commercial_advisor → /commercial-advisor
   └─ SI super_admin → /super-admin

4. ACCESO A MÓDULO PROTEGIDO
   │
   ├─ Ruta intenta acceder a /location-manager
   ├─ <RequireRole role="manager"> verifica
   │  ├─ ¿User tiene role "manager"? SÍ → Permitir acceso
   │  └─ ¿User tiene role "manager"? NO → Redirigir a /unauthorized
   │
   └─ Componente carga y obtiene datos vía service layer
      ├─ locationManagerService.getMaterials()
      ├─ apiCall.get('/api/materials', { headers: { Authorization: token } })
      └─ Retorna datos → Se renderizan en UI

5. LOGOUT
   │
   ├─ Usuario hace click en logout
   ├─ Limpia AuthContext
   ├─ Limpia localStorage
   └─ Redirige a /login
```

---

## Tipos de Datos Clave

### User (Almacenado en AuthContext)
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "commercial_advisor" | "warehouse_operator" | "super_admin";
  organization_id?: string;
  phone?: string;
  avatar?: string;
}
```

### API Response Format
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}
```

### Entity Examples

#### Location Manager
- Material (SKU, name, price, category, status)
- Category (name, description, material_count)
- MaterialModel (code, category, variants, type)
- Attribute (name, type, values, adoption_rate)
- MaterialPlan (name, duration, price, materials)

#### Commercial Advisor
- Customer (name, email, phone, company, city, status)
- Order (id, customer, items, invoice_date, rental_period, total, status)
- Contract (id, customer, dates, value, items_count, status)
- Rental (id, customer, materials, dates, progress, deposit, status)
- Invoice (id, customer, dates, total, paid, remaining, status)

---

## Estadísticas del Sistema

| Aspecto | Cantidad |
|---------|----------|
| **Módulos** | 5 (admin, warehouse-operator, location-manager, commercial-advisor, super-admin) |
| **Páginas Totales** | 31+ |
| **Servicios API** | 15+ |
| **Componentes Reutilizables** | 15+ |
| **Hooks Personalizados** | 5+ |
| **Rutas Protegidas** | 25+ |
| **Líneas de Código** | ~10,000+ |
| **Archivos TypeScript** | 60+ |

---

## Stack Tecnológico

```
FRONTEND
├── React 18
├── TypeScript 5
├── React Router v6 (Routing)
├── Tailwind CSS (Styling)
├── Lucide React (Icons)
├── Vite (Build Tool)
└── Vitest (Testing)

DEPENDENCIES
├── axios / fetch (HTTP)
└── JWT (Authentication)

BACKEND (A Implementar)
├── Node.js / Express (o similar)
├── PostgreSQL / MongoDB (Database)
├── JWT (Authentication)
└── CORS (Cross-Origin)
```

---

## Próximos Pasos

### Fase 1: Integración Backend ✅ Listado
1. [ ] Definir contratos API con backend
2. [ ] Configurar endpoints en backend
3. [ ] Reemplazar mock data con API calls reales
4. [ ] Implementar error handling
5. [ ] Testing de integración

### Fase 2: Mejoras Frontend
1. [ ] Agregar modales para CRUD
2. [ ] Ag confirmación dialogs
3. [ ] Toast notifications
4. [ ] Paginación avanzada
5. [ ] Búsqueda full-text

### Fase 3: Optimizaciones
1. [ ] Caching
2. [ ] Lazy loading de datos
3. [ ] Optimización de performance
4. [ ] Accesibilidad (a11y)
5. [ ] Mobile responsive

---

**Versión:** 1.0
**Última actualización:** 2024
**Estado:** En Desarrollo - Mock Data Activo
