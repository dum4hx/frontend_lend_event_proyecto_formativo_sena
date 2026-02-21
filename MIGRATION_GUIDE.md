# 🔄 Guía de Migración: Mock Data → API Real

## Visión General
Este documento proporciona pasos claros para transicionar los módulos de datos simulados a API real.

---

## Paso 1: Actualizar el Service Layer

### ANTES (Mock Data)
```typescript
// src/services/locationManagerService.ts

export const getMaterials = async (): Promise<ApiSuccessResponse<Material[]>> => {
  // Mock API call
  return Promise.resolve({
    success: true,
    data: [] as Material[],
  });
};
```

### DESPUÉS (API Real)
```typescript
// src/services/locationManagerService.ts
import { apiCall } from "../lib/api";

export const getMaterials = async (): Promise<ApiSuccessResponse<Material[]>> => {
  return await apiCall.get<Material[]>('/api/materials');
};

export const getMaterialById = async (id: string): Promise<ApiSuccessResponse<Material>> => {
  return await apiCall.get<Material>(`/api/materials/${id}`);
};

export const createMaterial = async (material: Omit<Material, "id">): Promise<ApiSuccessResponse<Material>> => {
  return await apiCall.post<Omit<Material, "id">, Material>('/api/materials', material);
};

export const updateMaterial = async (id: string, material: Partial<Material>): Promise<ApiSuccessResponse<Material>> => {
  return await apiCall.patch<Partial<Material>, Material>(`/api/materials/${id}`, material);
};

export const deleteMaterial = async (id: string): Promise<ApiSuccessResponse<void>> => {
  return await apiCall.delete(`/api/materials/${id}`);
};
```

---

## Paso 2: Actualizar Componentes de Página

### ANTES (Mock Data)
```typescript
// src/modules/location-manager/pages/Materials.tsx

const SAMPLE_MATERIALS: Material[] = [
  {
    id: "1",
    name: "Office Chair - Ergonomic",
    sku: "CHR-001",
    // ... más datos
  },
  // ... más materiales
];

export default function Materials() {
  const [materials] = useState<Material[]>(SAMPLE_MATERIALS);
  
  return (
    <div>
      {/* JSX usando materials */}
    </div>
  );
}
```

### DESPUÉS (API Real)
```typescript
// src/modules/location-manager/pages/Materials.tsx
import { useEffect, useState } from "react";
import { locationManagerService } from "../../../services/locationManagerService";
import { LoadingSpinner } from "../../../components/ui";
import { ErrorDisplay } from "../../../components/ui";

interface FetchState {
  loading: boolean;
  error: string | null;
  data: Material[];
}

export default function Materials() {
  const [state, setState] = useState<FetchState>({
    loading: true,
    error: null,
    data: [],
  });

  // Cargar materiales al montar el componente
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await locationManagerService.getMaterials();
        
        if (response.success) {
          setState(prev => ({
            ...prev,
            data: response.data,
            loading: false,
          }));
        } else {
          throw new Error('Failed to fetch materials');
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    fetchMaterials();
  }, []);

  // Crear material
  const handleCreate = async (newMaterial: Omit<Material, "id">) => {
    try {
      const response = await locationManagerService.createMaterial(newMaterial);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: [...prev.data, response.data],
        }));
      }
    } catch (error) {
      console.error('Error creating material:', error);
      alert('Error creating material');
    }
  };

  // Actualizar material
  const handleUpdate = async (id: string, updates: Partial<Material>) => {
    try {
      const response = await locationManagerService.updateMaterial(id, updates);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: prev.data.map(m => m.id === id ? response.data : m),
        }));
      }
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Error updating material');
    }
  };

  // Eliminar material
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    
    try {
      const response = await locationManagerService.deleteMaterial(id);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: prev.data.filter(m => m.id !== id),
        }));
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error deleting material');
    }
  };

  // Render states
  if (state.loading) {
    return <LoadingSpinner />;
  }

  if (state.error) {
    return <ErrorDisplay message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Materials</h1>
        </div>
        <button 
          onClick={() => handleCreate(/* new material form data */)}
          className="px-4 py-2 bg-[#FFD700] text-black rounded font-semibold"
        >
          Add Material
        </button>
      </div>

      {/* Tu JSX existente aquí, pero usando state.data en lugar de SAMPLE_MATERIALS */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <table className="w-full">
          {/* ... trozo de código igual que antes ... */}
          <tbody>
            {state.data.map((material) => (
              <tr key={material.id} className="border-b border-[#333] hover:bg-[#1a1a1a]">
                {/* ... celdas de tabla ... */}
                <td className="px-6 py-4">
                  <button onClick={() => handleUpdate(material.id, { /* updates */ })}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(material.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Paso 3: Configurar Backend Endpoints

Los endpoints esperados por la aplicación:

### Location Manager
```
GET    /api/materials              → Lista de materiales
POST   /api/materials              → Crear material
GET    /api/materials/:id          → Obtener material
PATCH  /api/materials/:id          → Actualizar material
DELETE /api/materials/:id          → Eliminar material

GET    /api/categories             → Categorías
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/models
POST   /api/models
GET    /api/models/:id
PATCH  /api/models/:id
DELETE /api/models/:id

GET    /api/attributes
POST   /api/attributes
GET    /api/attributes/:id
PATCH  /api/attributes/:id
DELETE /api/attributes/:id

GET    /api/plans
POST   /api/plans
GET    /api/plans/:id
PATCH  /api/plans/:id
DELETE /api/plans/:id

GET    /api/dashboard/location-manager/stats → Estadísticas
```

### Commercial Advisor
```
GET    /api/customers             → Clientes
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
DELETE /api/customers/:id

GET    /api/orders                → Órdenes
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id

GET    /api/contracts            → Contratos
POST   /api/contracts
GET    /api/contracts/:id
PATCH  /api/contracts/:id
DELETE /api/contracts/:id

GET    /api/rentals              → Alquileres
POST   /api/rentals
GET    /api/rentals/:id
PATCH  /api/rentals/:id
DELETE /api/rentals/:id

GET    /api/invoices             → Facturas
POST   /api/invoices
GET    /api/invoices/:id
PATCH  /api/invoices/:id
DELETE /api/invoices/:id

POST   /api/reports/generate     → Generar reportes
GET    /api/reports/:id
GET    /api/reports

GET    /api/dashboard/commercial-advisor/stats → Estadísticas
```

---

## Paso 4: Verificar Formatos de Respuesta

### Formato de Respuesta Exitosa
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Office Chair",
    // ... otros campos
  }
}
```

### Formato de Respuesta con Error
```json
{
  "success": false,
  "error": {
    "message": "Material not found",
    "code": "NOT_FOUND"
  }
}
```

### Asegúrate de que tu API retorna en este formato
Si tu API retorna diferente, ajusta `src/lib/api.ts`:

```typescript
// src/lib/api.ts
export const apiCall = {
  get: async <T>(url: string): Promise<ApiSuccessResponse<T>> => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Request failed');
    }
    
    const json = await response.json();
    
    // Ajusta según tu formato
    return {
      success: true,
      data: json.data || json, // Depende de tu estructura
    };
  },
  // ... más métodos
};
```

---

## Paso 5: Testing de Integración

### Test 1: Lectura de Datos
```typescript
// Abre DevTools Console
await locationManagerService.getMaterials();
// Debe retornar datos reales del backend
```

### Test 2: Creación
```typescript
// En material create modal
const newMaterial = {
  name: "New Chair",
  sku: "CHR-999",
  // ... otros campos
};
const response = await locationManagerService.createMaterial(newMaterial);
console.log(response); // Debe mostrar el nuevo material con ID
```

### Test 3: Actualización
```typescript
const response = await locationManagerService.updateMaterial("1", {
  price: 300,
});
console.log(response); // Debe mostrar el material actualizado
```

### Test 4: Eliminación
```typescript
const response = await locationManagerService.deleteMaterial("1");
console.log(response.success); // Debe ser true
```

---

## Paso 6: Manejar Errores Comunes

### Error: 401 Unauthorized
**Causa:** Token JWT expirado o ausente
**Solución:**
```typescript
// En apiCall, refresh token automáticamente
if (response.status === 401) {
  const newToken = await refreshToken();
  // Reintentar request
}
```

### Error: 404 Not Found
**Causa:** Endpoint no existe
**Solución:**
- Verificar URL de endpoint
- Verificar método HTTP (GET vs POST)
- Revisar documentación de API

### Error: 500 Server Error
**Causa:** Error en backend
**Solución:**
- Revisar logs del servidor
- Verificar datos enviados
- Contactar al equipo backend

### Error: CORS
**Causa:** Headers de CORS no configurados
**Solución:**
```bash
# En servidor backend
headers: {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

---

## Paso 7: Performance Optimization

### Agregar Caching
```typescript
const cache = new Map();

export const getMaterials = async () => {
  const cached = cache.get('materials');
  if (cached && !isStale(cached.timestamp)) {
    return cached.data;
  }
  
  const response = await apiCall.get('/api/materials');
  cache.set('materials', {
    data: response,
    timestamp: Date.now(),
  });
  return response;
};
```

### Agregar Paginación
```typescript
// En página
const [page, setPage] = useState(1);
const [pageSize] = useState(20);

const fetchMaterials = async () => {
  const response = await apiCall.get(
    `/api/materials?page=${page}&pageSize=${pageSize}`
  );
  // maneja response.data.items y response.data.total
};
```

### Agregar Debouncing en Search
```typescript
import { useCallback } from 'react';
import { debounce } from 'lodash';

const handleSearch = useCallback(
  debounce(async (term: string) => {
    const response = await apiCall.get(`/api/materials?search=${term}`);
    setMaterials(response.data);
  }, 300),
  []
);
```

---

## Checklist de Migración

- [ ] Service layer actualizado con API calls reales
- [ ] Todos los endpoints están funcionando en backend
- [ ] Componentes usan useEffect para cargar datos
- [ ] Loading states implementados
- [ ] Error handling agregado
- [ ] Eliminados SAMPLE_* constants
- [ ] Testing manual de CRUD operações
- [ ] Token JWT maneja automáticamente
- [ ] CORS configurado en backend
- [ ] Performance optimizado (caching, paginación)
- [ ] Logs de error para debugging

---

## Rollback a Mock Data

Si algo sale mal, fácil rollback:

```typescript
// Temporalmente vuelve a mock
export const getMaterials = async () => {
  const SAMPLE_MATERIALS = [/* ... */];
  return Promise.resolve({
    success: true,
    data: SAMPLE_MATERIALS,
  });
};
```

---

## Soporte

Para problemas durante la migración:
1. Revisar console de navegador
2. Revisar logs del backend
3. Verificar Network tab en DevTools
4. Confirmar formato de respuesta de API
5. Validar autenticación JWT

---

**Versión:** 1.0
**Última actualización:** 2024
**Estado:** Listo para implementación
