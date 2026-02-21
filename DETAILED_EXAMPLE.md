# 📝 Ejemplo Paso a Paso: Migrar Materials.tsx a API Real

## El Objetivo
Cambiar `Materials.tsx` de usar SAMPLE_MATERIALS (mock data) a llamar `locationManagerService.getMaterials()` que consume API real.

---

## ANTES: Versión Mock (Como está ahora)

```typescript
// src/modules/location-manager/pages/Materials.tsx
import { useState } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";

interface Material {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  status: "active" | "inactive" | "discontinued";
  lastUpdated: string;
}

const SAMPLE_MATERIALS: Material[] = [
  {
    id: "1",
    name: "Office Chair - Ergonomic",
    sku: "CHR-001",
    price: 180,
    category: "Furniture",
    status: "active",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Desk Lamp - LED",
    sku: "LAMP-002",
    price: 45,
    category: "Lighting",
    status: "active",
    lastUpdated: "2024-01-14",
  },
  {
    id: "3",
    name: "Whiteboard - 4x6ft",
    sku: "WB-003",
    price: 120,
    category: "Office Supplies",
    status: "inactive",
    lastUpdated: "2024-01-10",
  },
  {
    id: "4",
    name: "Projector - HD",
    sku: "PROJ-004",
    price: 950,
    category: "Electronics",
    status: "active",
    lastUpdated: "2024-01-12",
  },
  {
    id: "5",
    name: "Conference Table",
    sku: "TABLE-005",
    price: 800,
    category: "Furniture",
    status: "discontinued",
    lastUpdated: "2024-01-08",
  },
];

export default function Materials() {
  const [materials] = useState<Material[]>(SAMPLE_MATERIALS); // ⚠️ SIN CAMBIOS
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(materials.map((m) => m.category))
  );

  return (
    <div className="space-y-6">
      {/* Header y Search Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Materials</h1>
          <p className="text-[#999] mt-2">Manage your material catalog</p>
        </div>
        <button className="px-6 py-2 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-yellow-400 flex items-center gap-2">
          <Plus size={20} />
          Add Material
        </button>
      </div>

      {/* Búsqueda y Filtro */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-[#666]"
          />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Material
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                SKU
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((material) => (
              <tr
                key={material.id}
                className="border-b border-[#333] hover:bg-[#1a1a1a]"
              >
                <td className="px-6 py-4 text-white">{material.name}</td>
                <td className="px-6 py-4 text-[#999]">{material.sku}</td>
                <td className="px-6 py-4 text-[#999]">
                  {material.category}
                </td>
                <td className="px-6 py-4 text-white">${material.price}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      material.status === "active"
                        ? "bg-green-900 text-green-200"
                        : material.status === "inactive"
                        ? "bg-orange-900 text-orange-200"
                        : "bg-red-900 text-red-200"
                    }`}
                  >
                    {material.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button className="p-1 hover:bg-[#1a1a1a] rounded">
                      <Edit size={20} className="text-[#FFD700]" />
                    </button>
                    <button className="p-1 hover:bg-[#1a1a1a] rounded">
                      <Trash2 size={20} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Estado vacío */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#666]">No materials found</p>
        </div>
      )}
    </div>
  );
}
```

---

## DESPUÉS: Versión con API Real

### Paso 1: Actualizar el Generador de Servicios

```typescript
// src/services/locationManagerService.ts
// ANTES (Mock):
export const getMaterials = async (): Promise<ApiSuccessResponse<Material[]>> => {
  return Promise.resolve({
    success: true,
    data: [] as Material[],
  });
};

// DESPUÉS (API Real):
export const getMaterials = async (): Promise<ApiSuccessResponse<Material[]>> => {
  return await apiCall.get<Material[]>('/api/materials');
};

export const deleteMaterial = async (id: string): Promise<ApiSuccessResponse<void>> => {
  return await apiCall.delete(`/api/materials/${id}`);
};
```

### Paso 2: Actualizar el Componente

```typescript
// src/modules/location-manager/pages/Materials.tsx
import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { locationManagerService } from "../../../services/locationManagerService";
import { LoadingSpinner, ErrorDisplay } from "../../../components/ui";

interface Material {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  status: "active" | "inactive" | "discontinued";
  lastUpdated: string;
}

interface PageState {
  loading: boolean;
  error: string | null;
  materials: Material[];
}

// ✅ ELIMINAMOS: const SAMPLE_MATERIALS = [...]

export default function Materials() {
  // ✅ Estado más robusto
  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    materials: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ✅ NUEVO: useEffect para cargar datos al montar
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        
        const response = await locationManagerService.getMaterials();

        if (response.success) {
          setState((prev) => ({
            ...prev,
            materials: response.data,
            loading: false,
          }));
        } else {
          throw new Error("Failed to fetch materials");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred",
          loading: false,
        }));
      }
    };

    fetchMaterials();
  }, []); // Solo ejecutar una vez al cargar

  // ✅ FUNCIÓN PARA ELIMINAR
  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this material? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await locationManagerService.deleteMaterial(id);

      if (response.success) {
        // Actualizar estado removiendo el material
        setState((prev) => ({
          ...prev,
          materials: prev.materials.filter((m) => m.id !== id),
        }));
        alert("Material deleted successfully");
      } else {
        throw new Error("Failed to delete material");
      }
    } catch (error) {
      alert(
        `Error deleting material: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Cálculos usando materials del estado
  const filteredMaterials = state.materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(state.materials.map((m) => m.category))
  );

  // ✅ HANDLE: Loading State
  if (state.loading) {
    return <LoadingSpinner />;
  }

  // ✅ HANDLE: Error State
  if (state.error) {
    return (
      <div className="space-y-4">
        <ErrorDisplay message={state.error} />
        <button
          onClick={() => {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            // Reintentar fetch aquí
          }}
          className="px-4 py-2 bg-[#FFD700] text-black rounded font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ✅ MAIN RENDER
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Materials</h1>
          <p className="text-[#999] mt-2">
            {state.materials.length} materials in catalog
          </p>
        </div>
        <button className="px-6 py-2 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-yellow-400 flex items-center gap-2">
          <Plus size={20} />
          Add Material
        </button>
      </div>

      {/* Búsqueda y Filtro */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-3 text-[#666]"
          />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Material
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                SKU
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((material) => (
              <tr
                key={material.id}
                className="border-b border-[#333] hover:bg-[#1a1a1a]"
              >
                <td className="px-6 py-4 text-white">{material.name}</td>
                <td className="px-6 py-4 text-[#999]">{material.sku}</td>
                <td className="px-6 py-4 text-[#999]">
                  {material.category}
                </td>
                <td className="px-6 py-4 text-white">${material.price}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      material.status === "active"
                        ? "bg-green-900 text-green-200"
                        : material.status === "inactive"
                        ? "bg-orange-900 text-orange-200"
                        : "bg-red-900 text-red-200"
                    }`}
                  >
                    {material.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button className="p-1 hover:bg-[#1a1a1a] rounded">
                      <Edit size={20} className="text-[#FFD700]" />
                    </button>
                    {/* ✅ onClick ahora llama a handleDelete! */}
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="p-1 hover:bg-[#1a1a1a] rounded"
                    >
                      <Trash2 size={20} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Estado vacío */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#666]">No materials found</p>
        </div>
      )}
    </div>
  );
}
```

---

## Cambios Clave (Resumen)

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Data** | `SAMPLE_MATERIALS[]` | `state.materials[]` |
| **Loading** | Sin loading | `state.loading` + `<LoadingSpinner />` |
| **Error** | Sin error handling | `state.error` + `<ErrorDisplay />` |
| **Primera carga** | instant | `useEffect` con fetch |
| **Delete** | Button vacío | `handleDelete()` funcional |
| **Service layer** | Mock Promise | API calls reales |

---

## Testing Manual

### Test 1: Carga Inicial ✅
```
1. Abrir página Materials
2. Debe mostrar "Loading..."
3. Después de 2-3s, debe mostrar lista de materiales
4. Contar materiales en tabla = cantidad en header
```

### Test 2: Búsqueda ✅
```
1. Tipear "Chair" en search
2. Tabla debe filtrar a "Office Chair - Ergonomic"
3. Limpiar búsqueda → volver a mostrar todos
```

### Test 3: Filtro de Categoría ✅
```
1. Seleccionar "Furniture" en dropdown
2. Tabla muestra solo materiales con esa categoría
3. Seleccionar "All Categories" → volver a mostrar todos
```

### Test 4: Eliminar Material ✅
```
1. Click en trash icon
2. Confirmación: "Are you sure? This cannot be undone"
3. Click OK
4. Material desaparece de tabla
5. Número en header disminuye
6. Alert: "Material deleted successfully"
```

### Test 5: Error Handling ✅
```
1. Desconectar internet
2. Recarga página
3. Debe mostrar error: "Failed to fetch materials"
4. "Try Again" button aparece
5. Reconecta internet y click Try Again
6. Datos cargan correctamente
```

---

## Debug Tips

### Si la tabla sale vacía:
```typescript
// En DevTools Console, ejecuta:
await fetch('/api/materials', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
// Deberías ver los datos que retorna tu API
```

### Si hay error 401 (Unauthorized):
```typescript
// Token no es válido o expiró
// Solución: Login nuevamente
// Verifica en localStorage.getItem('token')
```

### Si hay error 404 (Not Found):
```typescript
// Endpoint no existe o está mal escrito
// Verificar: /api/materials (no /materials ni /api/material)
// Preguntar al backend equipo sobre ruta exacta
```

---

## Next Steps

Una vez que esto funcione:

1. **Agregar Create**: `handleCreate()` para "Add Material" button
2. **Agregar Update**: `handleUpdate()` para "Edit" button
3. **Agregar Modal**: En lugar de confirmación, form modal para create/edit
4. **Agregar Paginación**: Si hay 1000+ materiales
5. **Mejorar UX**: Toast notifications en lugar de alert()

---

**Estado:** 🟢 Listo para migrar
**Dificultad:** Baja
**Tiempo Estimado:** 30 minutos por página
