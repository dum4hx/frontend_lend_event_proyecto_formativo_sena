# 🚀 Guía Rápida - Location Manager & Commercial Advisor

## Índice
1. [Acceso a los Módulos](#acceso-a-los-módulos)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Flujo de Datos (Mock → API)](#flujo-de-datos-mock--api)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Solución de Problemas](#solución-de-problemas)

---

## Acceso a los Módulos

### Location Manager (Gerente de Sede)
**URL:** `/location-manager`
**Role Requerido:** `manager`
**Funcionalidad:** Gestión completa de catálogo de materiales

```typescript
// Usuario automáticamente redirigido al login si no tiene role correcto
// Login → Check role → Redirect to /location-manager
```

### Commercial Advisor (Asesor Comercial)
**URL:** `/commercial-advisor`
**Role Requerido:** `commercial_advisor`
**Funcionalidad:** Gestión de pedidos, clientes y contratos

---

## Estructura de Carpetas

### Patrón de Módulo
```
src/modules/[nombre-modulo]/
├── components/
│   ├── Sidebar.tsx          # Navegación lateral
│   ├── StatCard.tsx         # Componente de estadísticas
│   └── index.ts             # Exports
├── layouts/
│   └── [Nombre]Layout.tsx   # Layout principal (Sidebar + Outlet)
├── pages/
│   ├── Dashboard.tsx        # Dashboard principal
│   ├── [Feature1].tsx       # Página de feature
│   ├── [Feature2].tsx       # Página de feature
│   └── Settings.tsx         # Configuración
```

### Servicios
```
src/services/
├── locationManagerService.ts      # API calls para Location Manager
├── commercialAdvisorService.ts    # API calls para Commercial Advisor
```

---

## Flujo de Datos (Mock → API)

### Actual (Con Mock Data)
```typescript
// En cada página (ej: Materials.tsx)
const SAMPLE_MATERIALS = [
  { id: "1", name: "Office Chair", ... },
  { id: "2", name: "Desk Lamp", ... },
];

export default function Materials() {
  const [materials] = useState(SAMPLE_MATERIALS);
  // ✅ Datos hardcoded
}
```

### Después (Con API)
```typescript
// En locationManagerService.ts
export const getMaterials = async () => {
  const response = await apiCall.get('/materials');
  return response.data;
};

// En Materials.tsx
import { locationManagerService } from '../services/locationManagerService';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const response = await locationManagerService.getMaterials();
        setMaterials(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  
  return (
    // ... mismo JSX, pero con datos reales
  );
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Agregar una Nueva Página a Location Manager

**1. Crear el archivo de página:**
```typescript
// src/modules/location-manager/pages/Pricing.tsx
import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Pricing() {
  const [prices, setPrices] = useState([
    { id: '1', category: 'Furniture', dailyRate: 50, weeklyRate: 280 },
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pricing Management</h1>
      {/* ... JSX de la página */}
    </div>
  );
}
```

**2. Agregar ruta en App.tsx:**
```typescript
// Import lazy
const PricingPage = lazy(() => import('./modules/location-manager/pages/Pricing'));

// Agregar en ruta location-manager
<Route path="/location-manager">
  {/* ... otras rutas */}
  <Route path="pricing" element={<PricingPage />} />
</Route>
```

**3. Agregar a Sidebar:**
```typescript
// En src/modules/location-manager/components/Sidebar.tsx
const navItems = [
  // ... items existentes
  {
    id: "pricing",
    label: "Pricing",
    icon: <DollarSign size={20} />,
    path: "/location-manager/pricing",
  },
];
```

### Ejemplo 2: Integrar API en Commercial Advisor Orders

**1. Actualizar el servicio:**
```typescript
// En commercialAdvisorService.ts - ANTES (Mock)
export const getOrders = async () => {
  return Promise.resolve({
    success: true,
    data: [] as Order[],
  });
};

// DESPUÉS (Con API)
import { apiCall } from '../lib/api';

export const getOrders = async () => {
  return await apiCall.get<Order[]>('/api/orders');
};
```

**2. Usar en componente:**
```typescript
// En modules/commercial-advisor/pages/Orders.tsx
import { commercialAdvisorService } from '../../../services/commercialAdvisorService';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const response = await commercialAdvisorService.getOrders();
        if (response.success) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {/* ... resto del JSX */}
    </div>
  );
}
```

### Ejemplo 3: Implementar CRUD Completo

```typescript
// En una página Location Manager
import { locationManagerService } from '../../../services/locationManagerService';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // LECTURA
  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        const response = await locationManagerService.getMaterials();
        setMaterials(response.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // CREAR
  const handleCreate = async (newMaterial) => {
    try {
      const response = await locationManagerService.createMaterial(newMaterial);
      if (response.success) {
        setMaterials([...materials, response.data]);
      }
    } catch (error) {
      alert('Error creando material');
    }
  };

  // ACTUALIZAR
  const handleUpdate = async (id, updates) => {
    try {
      const response = await locationManagerService.updateMaterial(id, updates);
      if (response.success) {
        setMaterials(
          materials.map(m => m.id === id ? response.data : m)
        );
      }
    } catch (error) {
      alert('Error actualizando material');
    }
  };

  // ELIMINAR
  const handleDelete = async (id) => {
    try {
      const response = await locationManagerService.deleteMaterial(id);
      if (response.success) {
        setMaterials(materials.filter(m => m.id !== id));
      }
    } catch (error) {
      alert('Error eliminando material');
    }
  };

  return (
    <div>
      {/* UI con handlers */}
      <button onClick={() => handleCreate(newMaterial)}>Add</button>
      <button onClick={() => handleUpdate(id, updates)}>Edit</button>
      <button onClick={() => handleDelete(id)}>Delete</button>
    </div>
  );
}
```

---

## Solución de Problemas

### Problema: "Ruta no encontrada"
**Causa:** Role del usuario no tiene acceso
**Solución:** 
1. Verificar role en AuthContext
2. Verificar RequireRole en App.tsx
3. Verificar roleRouting.ts

### Problema: "Las páginas cargan pero sin datos"
**Causa:** Mock data no está siendo usado correctamente
**Solución:**
```typescript
// Verificar que SAMPLE_* exista
const SAMPLE_DATA = [
  { id: '1', name: 'Test' }
];

// Y se use en useState
const [data] = useState(SAMPLE_DATA);
```

### Problema: "Componentes no renderean"
**Causa:** Lazy import con Suspense fallback
**Solución:**
```typescript
// En App.tsx, Suspense es global
<Suspense fallback={<LoadingSpinner />}>
  <NestedRoutes />
</Suspense>
```

### Problema: "Estilos no aplican"
**Causa:** Tailwind classes no reconocidas
**Solución:**
- Usar classes existentes: `bg-[#FFD700]`, `text-[#121212]`
- Revisar tailwind.config.js
- Verificar estructura de colores

### Problema: "API calls fallan al cambiar a real"
**Solución checklist:**
- [ ] Backend endpoint existe
- [ ] URL es correcta (`/api/...`)
- [ ] Token JWT en headers
- [ ] CORS configurado
- [ ] Response format coincide con interfaces
- [ ] Error handling implementado

---

## 📚 Referencia de APIs

### Location Manager Service

```typescript
// Materials
locationManagerService.getMaterials()
locationManagerService.getMaterialById(id)
locationManagerService.createMaterial(data)
locationManagerService.updateMaterial(id, data)
locationManagerService.deleteMaterial(id)

// Categories
locationManagerService.getCategories()
locationManagerService.createCategory(data)
locationManagerService.updateCategory(id, data)
locationManagerService.deleteCategory(id)

// Models
locationManagerService.getModels()
locationManagerService.createModel(data)
locationManagerService.updateModel(id, data)
locationManagerService.deleteModel(id)

// Attributes
locationManagerService.getAttributes()
locationManagerService.createAttribute(data)
locationManagerService.updateAttribute(id, data)
locationManagerService.deleteAttribute(id)

// Plans
locationManagerService.getPlans()
locationManagerService.createPlan(data)
locationManagerService.updatePlan(id, data)
locationManagerService.deletePlan(id)

// Dashboard
locationManagerService.getDashboardStats()
```

### Commercial Advisor Service

```typescript
// Customers
commercialAdvisorService.getCustomers()
commercialAdvisorService.getCustomerById(id)
commercialAdvisorService.createCustomer(data)
commercialAdvisorService.updateCustomer(id, data)
commercialAdvisorService.deleteCustomer(id)

// Orders
commercialAdvisorService.getOrders()
commercialAdvisorService.getOrderById(id)
commercialAdvisorService.createOrder(data)
commercialAdvisorService.updateOrder(id, data)
commercialAdvisorService.deleteOrder(id)

// Contracts
commercialAdvisorService.getContracts()
commercialAdvisorService.getContractById(id)
commercialAdvisorService.createContract(data)
commercialAdvisorService.updateContract(id, data)
commercialAdvisorService.deleteContract(id)

// Rentals
commercialAdvisorService.getRentals()
commercialAdvisorService.getRentalById(id)
commercialAdvisorService.createRental(data)
commercialAdvisorService.updateRental(id, data)
commercialAdvisorService.deleteRental(id)

// Invoices
commercialAdvisorService.getInvoices()
commercialAdvisorService.getInvoiceById(id)
commercialAdvisorService.createInvoice(data)
commercialAdvisorService.updateInvoice(id, data)
commercialAdvisorService.deleteInvoice(id)

// Dashboard
commercialAdvisorService.getDashboardStats()
```

---

## ✨ Tips & Tricks

### 1. Reutilizar Componentes
```typescript
// StatCard es reutilizable en cualquier página
import { StatCard } from '../components';

<StatCard 
  label="Total Items"
  value={156}
  icon={<Package size={32} />}
  trend="12% growth"
  trendUp={true}
/>
```

### 2. Mantener Consistencia de Datos
```typescript
// Define tipos en service, úsalos en UI
interface Material {
  id: string;
  name: string;
  // ...
}

const [materials, setMaterials] = useState<Material[]>([]);
```

### 3. Manejo de Estados Compartidos
```typescript
// Para datos compartidos entre páginas, considera Context
import { createContext } from 'react';

export const MaterialContext = createContext();
```

### 4. Testing de Funcionalidad
```bash
# Sin backend, todas las acciones usan mock data
# Para testear:
# 1. Click en botones
# 2. Búsqueda/filtrado
# 3. Navegación entre páginas
# 4. Responsiveness en mobile
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Verificar estructura de archivos
2. Revisar console.log de errores
3. Comprobar imports/exports
4. Validar tipos TypeScript

---

**Última actualización:** 2024
**Versión:** 1.0
**Estado:** Producción Ready (Frontend)
