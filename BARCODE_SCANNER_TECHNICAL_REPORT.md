# REPORTE TÉCNICO: Funcionalidad de Lector de Código de Barras - LendEvent Frontend

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura General](#arquitectura-general)
4. [Componentes y Hooks](#componentes-y-hooks)
5. [Tipos TypeScript](#tipos-typescript)
6. [Flujo de Integración API](#flujo-de-integración-api)
7. [Payloads Detallados](#payloads-detallados)
8. [Casos de Uso](#casos-de-uso)
9. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
10. [Impresión de Códigos de Barras](#impresión-de-códigos-de-barras)

---

## Resumen Ejecutivo

La funcionalidad de lector de códigos de barras en LendEvent es un sistema completo que permite:

- **Captura automática** de entrada de scanners "keyboard-wedge" (simulan pulsaciones de teclado)
- **Búsqueda hybrid** por número serial O código de barras de un material
- **Creación on-demand** de nuevas instancias si el código no existe
- **Cambios de estado rápidos** (loaned, returned, maintenance, etc.) directamente desde el scan
- **Impresión masiva** de etiquetas con códigos de barras en múltiples formatos de impresora
- **Auditoría** de todas las operaciones con notas vinculadas al código escaneado

**Ubicación principal:** `src/modules/app/modules/material-instances/`

---

## Stack Tecnológico

| Tecnología       | Versión                          | Propósito                                         |
| ---------------- | -------------------------------- | ------------------------------------------------- |
| **React**        | 19.x                             | Framework frontend                                |
| **TypeScript**   | 5.x                              | Type safety                                       |
| **jsbarcode**    | ^3.11.x                          | Generación de códigos de barras (formato CODE128) |
| **Lucide Icons** | ^0.x                             | Iconografía (Printer, X, etc.)                    |
| **Vite**         | ^5.x                             | Build tool                                        |
| **Tailwind CSS** | ^3.4.x                           | Estilos de UI                                     |
| **React Query**  | (queryClient)                    | Data fetching y caching                           |
| **Vitest**       | Testing framework                |
| **MSW**          | Mock Service Worker para testing |

**Dependencias del servidor:**

- Backend: MongoDB + Express.js
- Endpoints: REST API con validación de tenancia per organización

---

## Arquitectura General

```
📁 src/modules/app/modules/material-instances/
├── 📁 hooks/
│   └── useBarcodeScanner.ts          ← Hook principal de captura
├── 📁 components/
│   ├── MaterialInstanceForm.tsx      ← Formulario crear/editar instancia
│   ├── MaterialBarcode.tsx           ← Renderiza códigos de barras
│   └── BarcodePrintModal.tsx         ← Modal impresión masiva
├── 📁 pages/
│   └── MaterialInstanceCatalog.tsx   ← Página principal con workflow
├── 📁 help/
│   └── content/materialInstancesHelp.ts ← Documentación contextual
└── ...
```

**Integración de servicios:**

- `src/services/materialService.ts` → Capa de API
- `src/lib/api.ts` → Cliente HTTP centralizado
- `src/types/api.ts` → Interfaces TypeScript

---

## Componentes y Hooks

### 1. **Hook: `useBarcodeScanner`**

**Ubicación:** `src/modules/app/modules/material-instances/hooks/useBarcodeScanner.ts`

**Propósito:** Captura entrada de scanners de código de barras tipo "keyboard-wedge"

**Interfaz:**

```typescript
interface UseBarcodeScannerOptions {
  onScan: (code: string) => void; // Callback cuando se completa el escaneo
  enabled?: boolean; // Habilitar/deshabilitar el listener (default: true)
  minLength?: number; // Longitud mínima de caracteres (default: 4)
  idleResetMs?: number; // Tiempo en ms de inactividad para resetear buffer (default: 80)
  maxScanDurationMs?: number; // Duración máxima del escaneo (default: 350ms)
}
```

**Lógica interna:**

```
1. Escucha eventos globales `keydown`
2. Acumula caracteres en un buffer interno mientras se presionan teclas rápidamente
3. Resetea el buffer si pasa más de 80ms sin presionar teclas (idle)
4. Al detectar Enter:
   - Valida que el código tenga mínimo 4 caracteres
   - Valida que el tiempo total de escaneo ≤ 350ms (evita falsas positivas)
   - Ejecuta el callback `onScan(code)` si ambas validaciones pasan
5. Restaura el buffer y contadores para el siguiente escaneo
```

**Detalles técnicos:**

- Usa `useRef` para mantener estado persistente entre renders sin causar re-renders
- Filtra teclas de modificadores (Ctrl, Cmd, Alt) para evitar falsos positivos
- Solo procesa teclas de carácter único (`.key.length === 1`)
- El buffer se resetea silenciosamente después de cada escaneo exitoso

**Ejemplo de uso:**

```typescript
useBarcodeScanner({
  onScan: (code: string) => {
    console.log(`Código escaneado: ${code}`);
    handleScan(code);
  },
  enabled: isScannerEnabled,
  minLength: 4,
  idleResetMs: 80,
  maxScanDurationMs: 350,
});
```

---

### 2. **Componente: `MaterialInstanceForm`**

**Ubicación:** `src/modules/app/modules/material-instances/components/MaterialInstanceForm.tsx`

**Propósito:** Formulario reactivo para crear/editar instancias de material

**Props:**

```typescript
interface MaterialInstanceFormProps {
  onSubmit: (data: CreateMaterialInstancePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialInstancePayload>;
  isEditing?: boolean;
}
```

**Campos del formulario:**

- **Model (Tipo de Material):** selector dropdown (requerido)
- **Serial Number:** texto (requerido, max 100 chars)
- **Barcode:** texto (opcional, max 120 chars)
- **Location:** selector dropdown de ubicaciones (requerido)
- **Purchase Date:** fecha (opcional)
- **Purchase Cost:** número en COP (opcional)
- **Use Barcode as Serial:** checkbox booleano

**Lógica especial:**

```typescript
// Si el formulario se abre con un barcode pre-rellenado del scanner:
if (initialData?.barcode && !initialData?.serialNumber) {
  // El toggle "Use Barcode as Serial" se activa automáticamente
  setUseBarcodeAsSerial(true);
  // Y el backend copia barcode → serialNumber
}

// Si se deshabilita el toggle:
if (!useBarcodeAsSerial) {
  // El serialNumber se convierte en el serial de la instancia
  // El barcode se mantiene como campo opcional
}
```

**Endpoint:** POST `/materials/instances`

---

### 3. **Componente: `MaterialBarcode`**

**Ubicación:** `src/modules/app/modules/material-instances/components/MaterialBarcode.tsx`

**Propósito:** Renderiza un código de barras CODE128 usando jsbarcode

**Props:**

```typescript
interface MaterialBarcodeProps {
  value?: string; // Código a renderizar (prioridad 1)
  fallbackValue?: string; // Fallback si value está vacío (prioridad 2)
  height?: number; // Alto en píxeles (default: 44)
  width?: number; // Ancho de barras (default: 1.2)
  compact?: boolean; // Modo compacto
  showCodeLabel?: boolean; // Mostrar valor debajo (default: true)
  className?: string; // Clases Tailwind
}
```

**Lógica:**

```typescript
const resolvedValue = value?.trim() || fallbackValue?.trim() || "";

// Si no hay valor:
// ↓ Renderiza "No barcode available"

// Si hay valor:
// ↓ Genera SVG de código de barras CODE128
// ↓ Aplica formato según preset (height, width, color)
```

**Configuración jsbarcode:**

```typescript
JsBarcode(element, value, {
  format: "CODE128", // Formato estándar de códigos de barras
  displayValue: false, // No mostrar valor debajo del barcode
  margin: 0, // Sin espacios en blanco
  width: 1.2, // Ancho de barras (ajustable)
  height: 44, // Alto del barcode (ajustable)
  background: "transparent", // Fondo transparente
  lineColor: "#111111", // Líneas negras
});
```

---

### 4. **Componente: `BarcodePrintModal`**

**Ubicación:** `src/modules/app/modules/material-instances/components/BarcodePrintModal.tsx`

**Propósito:** Modal para impresión masiva de etiquetas con códigos de barras

**Props:**

```typescript
interface BarcodePrintModalProps {
  isOpen: boolean;
  instances: MaterialInstance[];
  onClose: () => void;
}
```

**Presets de impresora:**

| Preset       | Dimensiones    | Tipo              | Uso típico                       |
| ------------ | -------------- | ----------------- | -------------------------------- |
| `zebra-4x6`  | 100 × 150 mm   | Etiqueta discreta | Etiquetas grandes de inventario  |
| `thermal-58` | 58 mm continuo | Rollo térmico     | Impresoras portátiles compactas  |
| `thermal-80` | 80 mm continuo | Rollo térmico     | Impresoras térmicas estándar POS |

**Configuración por preset:**

```typescript
{
  "zebra-4x6": {
    pageWidthMm: 100,
    pageHeightMm: 150,
    previewWidthPx: 360,
    barcodeHeight: 92,
    barcodeWidth: 2,
    compactLayout: false,   // Muestra nombre del material completo
  },
  "thermal-58": {
    pageWidthMm: 58,
    pageHeightMm: undefined, // Rollo continuo
    previewWidthPx: 240,
    barcodeHeight: 64,
    barcodeWidth: 1.4,
    compactLayout: true,    // Layout reducido para espacio limitado
  },
  "thermal-80": {
    pageWidthMm: 80,
    pageHeightMm: undefined,
    previewWidthPx: 300,
    barcodeHeight: 72,
    barcodeWidth: 1.7,
    compactLayout: true,
  }
}
```

**Features:**

- Selección de preset guardada en localStorage
- Múltiples copias por etiqueta (1-20)
- Vista previa en tiempo real
- Filtrado automático de instancias sin barcode/serial
- Impresión escalable (ajusta dimensiones automáticamente)
- Markup HTML completo generado para impresión

**Contenido de cada etiqueta:**

```html
<article class="barcode-card">
  <h3 class="barcode-title">{model.name}</h3>
  <p class="barcode-meta">Serial: {serialNumber} | Location: {locationName}</p>
  <div class="barcode-wrap">{CODE128 SVG barcode}</div>
  <p class="code">{BARCODE or SERIAL uppercase}</p>
  {si hay múltiples copias:}
  <p class="copy-mark">Copy {copyIndex} / {totalCopies}</p>
</article>
```

---

## Tipos TypeScript

### Interfaz: `MaterialInstance`

**Ubicación:** `src/types/api.ts` (línea 352)

```typescript
export interface MaterialInstance {
  _id: string; // ID MongoDB de la instancia
  serialNumber: string; // Identificador único por organización (max 100 chars)
  barcode?: string; // Código de barras físico (opcional, max 120 chars)
  status: MaterialInstanceStatus; // Estado actual (available, loaned, maintenance, etc.)

  model: {
    // Tipo de material (referencia a MaterialType)
    _id: string;
    name: string;
    description?: string;
    pricePerDay: number; // Precio de renta en centavos COP
  };

  locationId: {
    // Ubicación de almacenamiento
    _id: string;
    id: string;
    name: string;
  };

  organizationId: string; // Organización propietaria
  attributes: MaterialTypeAttribute[]; // Atributos del material (ej: color, capacidad)
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  __v: number; // Versionado MongoDB
}
```

### Tipo: `MaterialInstanceStatus`

```typescript
export type MaterialInstanceStatus =
  | "available" // Disponible para renta
  | "loaned" // En préstamo activo
  | "maintenance" // En mantenimiento
  | "damaged" // Dañado, no rentable
  | "retired"; // Retirado del inventario
```

### Interfaz: `CreateMaterialInstancePayload`

**Ubicación:** `src/types/api.ts` (línea 393)

```typescript
export interface CreateMaterialInstancePayload {
  modelId: string; // ID del tipo de material (requerido)
  serialNumber: string; // Serial único (requerido o auto-calculado)
  barcode?: string; // Código de barras (opcional en cliente, validado en servidor)
  locationId: string; // ID de la ubicación (requerido)
  purchaseDate?: string; // Fecha de compra ISO 8601 (opcional)
  purchaseCost?: number; // Costo en centavos COP (opcional)

  // Campo NO tipado en la interfaz pero usado en llamadas:
  // useBarcodeAsSerial?: boolean  // Flag para que server copie barcode → serialNumber
}
```

### Interfaz: `UpdateMaterialInstanceStatusPayload`

```typescript
export interface UpdateMaterialInstanceStatusPayload {
  status: MaterialInstanceStatus; // Nuevo estado
  notes?: string; // Notas de auditoría (usado para trail de scaneo)
}
```

### Interfaz: `MaterialInstancesQueryParams`

**Ubicación:** `src/types/api.ts` (línea 1419)

```typescript
export interface MaterialInstancesQueryParams {
  page?: number; // Paginación (default: 1)
  limit?: number; // Items por página (default: 20)
  searchTerm?: string; // Búsqueda por serial O barcode (case-insensitive)
  sortBy?: string; // Campo para ordenar
  sortOrder?: "asc" | "desc"; // Dirección de ordenamiento
  groupBy?: "location"; // Agrupar resultados por ubicación
  locationId?: string; // Filtrar por ubicación
  status?: MaterialInstanceStatus[] | MaterialInstanceStatus;
  materialTypeId?: string; // Filtrar por tipo
}
```

---

## Flujo de Integración API

### Flujo 1: Lectura (Get Material Instances)

```
┌─ CLIENTE
│  useBarcodeScanner({ onScan: handleScan }) ← Escucha entrada de teclado
│  ↓
│  handleScan(rawCode) ← Código escaneado
│  ├─ normalizado: rawCode.trim().toLowerCase()
│  ├─ busca en "instances" array local (NO hace API call aún)
│  │  └─ busca coincidencia en serial O barcode
│  ├─ Si encuentra: selecciona instancia, muestra toast
│  └─ Si NO encuentra: ofrece crear nueva o espera más input
│  ↓
│  Si se carga la página por primera vez:
│  └─ llamada GET /materials/instances?page=1&limit=50&groupBy=location
│
├─ SERVIDOR (Express.js + MongoDB)
│  ├─ Valida autenticación del usuario
│  ├─ Valida autorización (tenancy: solo instancias de su org)
│  ├─ Query MongoDB con filtros aplicados
│  └─ Retorna lista paginada agrupada por ubicación
│
└─ RESPUESTA 200 OK
   {
     "instances": [...],           // Array de instancias
     "byLocation": [               // Agrupado por ubicación
       { location, instances: [...] }
     ],
     "total": 245,
     "page": 1,
     "totalPages": 5
   }
```

### Flujo 2: Creación (Create Material Instance con Scanner)

```
┌─ CLIENTE
│  1. Scanner detecta código: "ABC123456789"
│  ├─ Hook useBarcodeScanner captura y normaliza
│  ├─ handleScan busca en local cache (no encuentra)
│  ├─ Muestra toast: "No instance found. Register as new?"
│  └─ Usuario hace clic en "Register Instance"
│
│  2. MaterialInstanceForm abre con initialData.barcode = "ABC123456789"
│  ├─ Form auto-activa toggle: useBarcodeAsSerial = true
│  ├─ User selecciona:
│  │  - Material Type (modelId)
│  │  - Location (locationId)
│  │  - Cargar campo serialNumber (será copiado del barcode por servidor)
│  │  - Opcional: Purchase Date, Purchase Cost
│  └─ User hace clic "Save"
│
│  3. Client validates form
│  ├─ serialNumber: not empty, max 100 chars
│  ├─ barcode: max 120 chars
│  └─ Shows validation errors if any
│
│  4. materialService.createMaterialInstance(payload) ← llamada API
│
├─ SERVIDOR
│  ├─ 🔐 Autentica usuario
│  ├─ 🔒 Valida: barcode única en la organización
│  ├─ 🔒 Valida: serialNumber única en la organización
│  ├─ 🔒 Valida: locationId existe y pertenece a la org
│  ├─ 🔒 Valida: modelId existe y pertenece a la org
│  ├─ 🎛️  Si useBarcodeAsSerial=true:
│  │  └─ copia barcode → serialNumber (override)
│  ├─ 📊 Verifica capacidad de la ubicación
│  │  └─ Si excedida: ↔️ 409 Conflict (opcionalmente con flag override)
│  ├─ 💾 Crea documento en MongoDB: db.instances.insertOne({...})
│  └─ ✅ Retorna instancia creada
│
└─ RESPUESTA 201 Created
   {
     "instance": {
       "_id": "60d5ec42f3b14a2c98a5e1a1",
       "serialNumber": "ABC123456789",      ← Copiado del barcode
       "barcode": "ABC123456789",
       "status": "available",
       "model": { _id, name, pricePerDay },
       "locationId": { _id, name },
       "organizationId": "507f...",
       "attributes": [],
       "createdAt": "2024-04-05T...",
       "updatedAt": "2024-04-05T...",
       "__v": 0
     }
   }

   Frontend:
   ├─ Toast: "✅ Instance registered successfully"
   ├─ Actualiza local state (instances array)
   ├─ Cierra modal del formulario
   └─ Selecciona la nueva instancia en la lista
```

### Flujo 3: Actualización de Estado (Status Change desde Scanner)

```
┌─ CLIENTE
│  1. User hace escaneo exitoso
│  ├─ Sistema encuentra la instancia
│  └─ Muestra Quick Status Buttons: "Mark Loaned", "Mark In Use", etc.
│
│  2. User hace clic en "Mark Loaned"
│  ├─ Extrae el lastScannedCode
│  └─ Construye payload:
│     {
│       status: "loaned",
│       notes: "Updated from scanner flow using code ABC123456789"
│     }
│
│  3. materialService.updateMaterialInstanceStatus(instanceId, payload)
│
├─ SERVIDOR
│  ├─ 🔐 Autentica usuario
│  ├─ 🔒 Valida: instanceId existe y pertenece a su org
│  ├─ 🔒 Valida: nuevo status es válido
│  ├─ 📝 Almacena notas para auditoría
│  ├─ 💾 PATCH /materials/instances/:id/status
│  │  └─ db.instances.updateOne({ _id }, { status, updatedAt })
│  └─ ✅ Retorna instancia actualizada
│
└─ RESPUESTA 200 OK
   {
     "instance": {
       ...previousData,
       "status": "loaned",          ← Actualizado
       "updatedAt": "2024-04-05T15:45:30.000Z",
       "__v": 1
     }
   }

   Frontend:
   ├─ Toast: "✅ Status updated to LOANED for ABC123456789"
   ├─ Actualiza selectedInstance en estado local
   ├─ Lista se actualiza automáticamente
   └─ Vuelve a estar lista para el siguiente escaneo
```

---

## Payloads Detallados

### Payload 1: Crear Instancia (Barcode "Zebra Scanner")

**Request:**

```json
POST /materials/instances

{
  "modelId": "64f1a2b3c4d5e6f7a8b9c0de",
  "serialNumber": "PROJ-4K-2024-045",
  "barcode": "8718473649283",
  "locationId": "507f1f77bcf86cd799439011",
  "useBarcodeAsSerial": false,
  "purchaseDate": "2024-01-15",
  "purchaseCost": 5000000
}
```

**Response (201 Created):**

```json
{
  "instance": {
    "_id": "60d5ec42f3b14a2c98a5e1a1",
    "serialNumber": "PROJ-4K-2024-045",
    "barcode": "8718473649283",
    "status": "available",
    "model": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0de",
      "name": "Projector 4K Professional",
      "description": "High-lumen 4K projector with laser light source",
      "pricePerDay": 500000
    },
    "locationId": {
      "_id": "507f1f77bcf86cd799439011",
      "id": "507f1f77bcf86cd799439011",
      "name": "Bodega Principal - Cali"
    },
    "organizationId": "507f1f77bcf86cd799439012",
    "attributes": [
      {
        "id": "attr-res",
        "name": "Resolución",
        "value": "4K"
      },
      {
        "id": "attr-lamp",
        "name": "Tipo de Lámpara",
        "value": "Laser"
      }
    ],
    "createdAt": "2024-04-05T10:30:00.000Z",
    "updatedAt": "2024-04-05T10:30:00.000Z",
    "__v": 0
  }
}
```

---

### Payload 2: Crear Instancia (Barcode as Serial)

**Request:**

```json
POST /materials/instances

{
  "modelId": "64f1a2b3c4d5e6f7a8b9c0df",
  "serialNumber": "AUTO-GEN-001",
  "barcode": "EAN-123456789012",
  "locationId": "507f1f77bcf86cd799439011",
  "useBarcodeAsSerial": true,
  "purchaseDate": "2024-03-20"
}
```

**Response (201 Created):**

```json
{
  "instance": {
    "_id": "60d5ec42f3b14a2c98a5e1a2",
    "serialNumber": "EAN-123456789012",
    "barcode": "EAN-123456789012",
    "status": "available",
    "model": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0df",
      "name": "Laptop Business",
      "pricePerDay": 150000
    },
    "locationId": {
      "_id": "507f1f77bcf86cd799439011",
      "id": "507f1f77bcf86cd799439011",
      "name": "Bodega Principal - Cali"
    },
    "organizationId": "507f1f77bcf86cd799439012",
    "attributes": [],
    "createdAt": "2024-04-05T12:15:30.000Z",
    "updatedAt": "2024-04-05T12:15:30.000Z",
    "__v": 0
  }
}
```

---

### Payload 3: Cambiar Estado (Desde Scanner Workflow)

**Request:**

```json
PATCH /materials/instances/60d5ec42f3b14a2c98a5e1a1/status

{
  "status": "loaned",
  "notes": "Updated from scanner flow using code 8718473649283"
}
```

**Response (200 OK):**

```json
{
  "instance": {
    "_id": "60d5ec42f3b14a2c98a5e1a1",
    "serialNumber": "PROJ-4K-2024-045",
    "barcode": "8718473649283",
    "status": "loaned",
    "model": { ... },
    "locationId": { ... },
    "organizationId": "507f1f77bcf86cd799439012",
    "attributes": [ ... ],
    "createdAt": "2024-04-05T10:30:00.000Z",
    "updatedAt": "2024-04-05T15:45:30.000Z",
    "__v": 1
  }
}
```

---

### Payload 4: Query de Búsqueda (Por Barcode o Serial)

**Request:**

```
GET /materials/instances?searchTerm=8718473649283&groupBy=location&limit=50
```

**Response (200 OK):**

```json
{
  "byLocation": [
    {
      "location": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Bodega Principal - Cali",
        "id": "507f1f77bcf86cd799439011"
      },
      "instances": [
        {
          "_id": "60d5ec42f3b14a2c98a5e1a1",
          "serialNumber": "PROJ-4K-2024-045",
          "barcode": "8718473649283",
          "status": "available",
          "model": { ... },
          "locationId": { ... },
          "organizationId": "507f1f77bcf86cd799439012",
          "attributes": [ ... ],
          "createdAt": "2024-04-05T10:30:00.000Z",
          "updatedAt": "2024-04-05T15:45:30.000Z",
          "__v": 1
        }
      ]
    }
  ],
  "currentUserLocations": [ ... ],
  "otherLocations": [ ... ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## Casos de Uso

### Caso 1: Fast Checkout / Check-in de Equipo

**Escenario:** Operador de bodega recibe equipo devuelto de una renta

**Pasos:**

1. Operador activa "Scanner Enabled" en la interfaz
2. Escanea el código de barras del equipo con su lector
3. Sistema busca inmediatamente en la base de datos local
4. Si encuentra:
   - Muestra nombre del equipo: "Projector 4K Professional"
   - Muestra ubicación actual: "Bodega Principal - Cali"
   - Muestra estado anterior: "loaned"
5. Operador hace clic en "Mark Returned"
6. Sistema envía: `PATCH /materials/instances/{id}/status` con status="returned"
7. Toast de confirmación: "✅ Status updated to RETURNED"
8. Vuelve a estar listo para el siguiente escaneo

**Beneficios:**

- ⚡ 2-3 segundos por equipo
- ✅ Auditoría automática del código escaneado
- 🎯 Cero entrada manual de serial

---

### Caso 2: Recepción de Nuevo Equipo

**Escenario:** Empresa recibe 20 nuevos proyectores con códigos de barras EAN

**Pasos:**

1. Head de almacén abre "Material Instances" → "New Instance"
2. Selecciona "Create from Barcode Scan"
3. Selecciona modelo: "Projector 4K Professional"
4. Selecciona ubicación: "Bodega Principal - Cali"
5. Escanea código EAN del primer proyector
6. Sistema pre-rellena: barcode="EAN-8718473..."
7. Activa toggle: "Use Barcode as Serial"
8. Sistema auto-asigna: serialNumber="EAN-8718473..." (copia del barcode)
9. Hace clic "Save" → `POST /materials/instances` con useBarcodeAsSerial=true
10. Instancia creada con status="available"
11. Repite para los 20 proyectores

**Beneficios:**

- 📊 Ingesta masiva sin errores de transcripción
- 🎯 Serial = Barcode para rastreabilidad física
- ✅ Auditoría de fecha/hora de ingreso

---

### Caso 3: Impresión de Etiquetas Personalizadas

**Escenario:** Empresa necesita imprimir etiquetas de reemplazo para 10 cámaras

**Pasos:**

1. Head de almacén, en "Material Instances", selecciona 10 cámaras
2. Hace clic en "Print Barcodes" → abre BarcodePrintModal
3. Selecciona preset: "Thermal 80 mm" (su impresora estándar)
4. Ajusta "Copies per Label": 1
5. Hace clic "Preview" → ve diseño de 10 etiquetas
6. Cada etiqueta muestra:
   - Nombre: "Camera 4K HDR"
   - Serial: "CAM-001"
   - Ubicación: "Bodega Principal - Cali"
   - Código CODE128: [barcode visual]
   - Código de texto: "CAM-001" (en mayúscula)
7. Hace clic "Print"
   - Browser genera HTML con CSS de página completa
   - Abre diálogo de impresora nativa del SO
   - Imprime en la impresora térmica 80mm
8. Coloca etiquetas en las cámaras

**Beneficios:**

- 🏭 Integración con impresoras térmicas existentes
- 📦 Múltiples formatos por necesidad
- 💾 Preset guardado en localStorage (rápida reutilización)

---

### Caso 4: Búsqueda de Equipo Extraviado

**Escenario:** Cliente no devuelve proyector, empresa necesita localizarlo por serial

**Pasos:**

1. Operador, en "Material Instances", activa "Scanner Enabled"
2. Obtiene serial del contrato: "PROJ-4K-2024-045"
3. Escanea manualmente código de barras del serial grabado
4. Si scanner no funciona: ingresa manualmente en campo "Manual Scan"
5. Presiona "Find Code"
6. Sistema ejecuta: `GET /materials/instances?searchTerm=PROJ-4K-2024-045&groupBy=location`
7. Busca en serialNumber OR barcode (case-insensitive)
8. Encuentra la instancia:
   - Muestra: "Status: loaned"
   - Muestra: "Location: Bodega Principal - Cali"
   - Muestra: "Model: Projector 4K Professional"
9. Operador contacta al cliente con información de ubicación

**Beneficios:**

- 🔍 Búsqueda hybrid (serial O barcode)
- 📍 Localización rápida
- 📊 Auditoría de quién buscó y cuándo

---

## Validaciones y Reglas de Negocio

### Validaciones Cliente-Side

| Campo                                     | Regla                               | Implementación                 |
| ----------------------------------------- | ----------------------------------- | ------------------------------ |
| **useBarcodeScanner - minLength**         | Mínimo 4 caracteres                 | `if (code.length >= 4)`        |
| **useBarcodeScanner - maxScanDurationMs** | Escaneo debe tardar ≤ 350ms         | `if (now - startedAt <= 350)`  |
| **useBarcodeScanner - idleResetMs**       | Reset buffer si pasa 80ms sin tecla | `if (now - lastKeyAt > 80)`    |
| **MaterialInstanceForm - serialNumber**   | No vacío                            | `required: true`               |
| **MaterialInstanceForm - barcode**        | Máx 120 caracteres                  | `value.length <= 120`          |
| **MaterialInstanceForm - modelId**        | Debe existir                        | Select populated from DB       |
| **MaterialInstanceForm - locationId**     | Debe existir                        | Select populated from DB       |
| **BarcodePrintModal - copiesPerLabel**    | 1-20 copias                         | `copiesPerLabel >= 1 && <= 20` |

### Validaciones Servidor-Side

| Campo              | Regla                       | Error                              |
| ------------------ | --------------------------- | ---------------------------------- |
| **serialNumber**   | Única por org               | 409 Conflict                       |
| **serialNumber**   | Máx 100 chars               | 400 Bad Request                    |
| **barcode**        | Única por org (si presente) | 409 Conflict                       |
| **barcode**        | Máx 120 chars               | 400 Bad Request                    |
| **modelId**        | Debe existir en org         | 404 Not Found                      |
| **locationId**     | Debe existir en org         | 404 Not Found                      |
| **locationId**     | Capacidad no excedida       | 409 Conflict (con opción override) |
| **status**         | Valor válido                | 400 Bad Request                    |
| **organizationId** | Autenticación OK            | 401 Unauthorized                   |

### Reglas de Negocio

1. **Duplicidad:** Ningún serial o barcode puede repetirse dentro de una organización
   - Validado en servidor en índices MongoDB unique
   - Backend retorna 409 Conflict

2. **Tenancy:** Usuario solo puede ver/crear instancias de su organización
   - Validado en middleware de autenticación
   - Query MongoDB auto-filtra por organizationId

3. **Auto-copy de Barcode:** Si `useBarcodeAsSerial=true`, servidor copia `barcode` → `serialNumber`
   - Ocurre antes de validación de unicidad
   - Permite ingesta masiva sin generar seriales

4. **Capacidad de Ubicación:** No se pueden crear más instancias si se excede capacidad
   - Validado contra metadata de ubicación
   - Retorna 409 Conflict
   - Flag `force: true` puede bypass (si user tiene permiso)

5. **Estados Válidos:** Solo transiciones permitidas
   - `available` → `loaned`, `maintenance`, `retired`, `damaged`
   - `loaned` → `returned`, `maintenance`, `damaged`
   - Etc. (pueden ocurrir validaciones en backend)

6. **Auditoría:** Todas las operaciones via scanner se registran con notas
   - Campo `notes` en UpdateMaterialInstanceStatusPayload
   - Preserva el código escaneado: "Updated from scanner flow using code XXX"

---

## Impresión de Códigos de Barras

### Arquitectura de Impresión

```
┌─ BarcodePrintModal (React Component)
│  ├─ State: selectedPreset (zebra-4x6, thermal-58, thermal-80)
│  ├─ State: copiesPerLabel (1-20)
│  ├─ Selección de instancias a imprimir
│  └─ Preview en tiempo real
│
├─ PRINT_PRESETS (Configuración)
│  ├─ zebra-4x6: 100×150mm, layout clásico
│  ├─ thermal-58: 58mm continuo, layout compacto
│  └─ thermal-80: 80mm continuo, layout compacto
│
├─ buildPrintMarkup() (Generador de HTML)
│  ├─ Itera sobre labelItems
│  ├─ Para cada instancia:
│  │  ├─ Genera SVG de barcode CODE128 usando jsbarcode
│  │  ├─ Formatea metadata (serial, ubicación, modelo)
│  │  ├─ Aplica CSS según preset seleccionado
│  │  └─ Genera <article> con estructura de etiqueta
│  │
│  ├─ Escapa HTML (& < > " ')
│  ├─ Crea string HTML completo
│  └─ Retorna markup listo para impresión
│
├─ window.open() + document.write()
│  ├─ Abre nueva ventana/pestaña
│  ├─ Escribe markup HTML completo
│  ├─ Cierra documento
│  └─ Impresión se desencadena automáticamente
│
└─ Browser Print Dialog (SO)
   ├─ Usuario confirma impresora
   ├─ Ajusta márgenes (normalmente 0)
   ├─ Imprime las etiquetas
   └─ Cierra ventana
```

### Estructura HTML de Etiqueta

```html
<article class="barcode-card">
  <!-- Título: Nombre del material o Serial (según preset) -->
  <h3 class="barcode-title compact">Projector 4K</h3>

  <!-- Metadata: Serial + Ubicación -->
  <p class="barcode-meta compact">Serial: PROJ-4K-2024-045 | Location: Bodega Principal - Cali</p>

  <!-- SVG del código de barras CODE128 -->
  <div class="barcode-wrap compact">
    <svg xmlns="http://www.w3.org/2000/svg" ...>
      <!-- Barras generadas por jsbarcode -->
    </svg>
  </div>

  <!-- Código en texto legible -->
  <p class="code compact">PROJ-4K-2024-045</p>

  <!-- Si hay múltiples copias -->
  <p class="copy-mark">Copy 1 / 3</p>
</article>
```

### Formatos CODE128

**Especificación por jsbarcode:**

- **Formato:** CODE128 (estándar industrial)
- **Caracteres permitidos:** Todos los caracteres ASCII (0-127)
- **Checksum:** Automático
- **Ancho de barras:** Configurable (1.2 - 2.0 pixeles típico)
- **Alto:** Configurable (44 - 92 pixeles típico)
- **Modo de renderización:** SVG (escalable, sin pérdida)

---

## Conclusiones Técnicas

### Fortalezas

✅ **Captura automática sin intervención:** Hook useBarcodeScanner integrado globalmente  
✅ **Búsqueda hybrid:** Busca por serial O barcode automáticamente  
✅ **Creación on-demand:** Facilita ingesta sin pre-registro  
✅ **Auditoría completa:** Notas vinculadas al código escaneado  
✅ **Impresión multi-formato:** Soporta Zebra, thermal 58mm, thermal 80mm  
✅ **Type-safety:** Interfaces TypeScript exhaustivas (sin `any`)  
✅ **Validación bidireccional:** Cliente + servidor  
✅ **UX responsivo:** Toasts, modales, validación visual

### Limitaciones

⚠️ Requiere scanner de teclado (no soporta USB HID scanner puro sin simulación)  
⚠️ Impresión depende de navegador + SO (variaciones por driver)  
⚠️ Capacidad de ubicación es límite blando (flag `force` puede bypass)  
⚠️ No hay soporte para códigos QR (solo CODE128)

### Recomendaciones

1. **Monitoreo:** Registrar tiempos de escaneo para detectar anomalías
2. **Ampliación:** Agregar soporte para QR codes (adicional a CODE128)
3. **Mobile:** Considerar PWA + camera API para lectores mobile nativos
4. **Sincronización:** Implementar offline-mode con IndexedDB para operadores remotos
5. **Analytics:** Rastrear tasa de éxito de escaneos para medir eficiencia

---

## Referencias en Codebase

- **Hook:** `src/modules/app/modules/material-instances/hooks/useBarcodeScanner.ts`
- **Componentes UI:** `src/modules/app/modules/material-instances/components/`
- **Tipos:** `src/types/api.ts` líneas 352, 393
- **Servicios:** `src/services/materialService.ts`
- **Página:** `src/modules/app/modules/material-instances/pages/MaterialInstanceCatalog.tsx`
- **Help:** `src/modules/app/help/content/materialInstancesHelp.ts`

---

**Reporte generado:** April 5, 2026  
**Versión:** 1.0  
**Scope:** LendEvent Frontend Barcode Scanner Functionality  
**Formato:** Markdown (.md)
