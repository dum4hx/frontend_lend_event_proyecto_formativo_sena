# LendEvent Frontend Coding Standards

**Project:** LendEvent Frontend (React 19 + TypeScript + Vite SPA)  
**Purpose:** Guide agent on project architecture, component patterns, API integration, and coding conventions.

---

## Core Principles

1. **Type Safety First** — Strict TypeScript. No `any` types. All data structures derive from interfaces in `src/types/api.ts`, which are derived from `docs/API_DOCUMENTATION.md`.
2. **Single Source of Truth for API** — `docs/API_DOCUMENTATION.md` is authoritative. When adding new API features, first document them there, then generate/update `src/types/api.ts` interfaces.
3. **Centralized HTTP Layer** — All HTTP calls go through `src/lib/api.ts` (typed fetch wrapper). No raw `fetch()`, no axios, no external HTTP libraries.
4. **Reusable Component Library** — Build components in `src/components/ui/` with export barrel (`index.ts`). Define strict prop interfaces. Include JSDoc comments explaining purpose, props, and accessibility features.
5. **Domain-Driven Services** — One service file per domain entity (`src/services/authService.ts`, `src/services/materialService.ts`, etc.). Each function is fully typed. Re-export types for consumer convenience.
6. **Functional Components + Hooks** — React 19 functional components with TypeScript. Use context for global state (auth, toasts). Use custom hooks for reusable logic.
7. **Style with Tailwind + CSS Modules** — Utility classes via `tailwind.config.js`. CSS Modules for component-specific scoping. Theme defined in `src/index.css` with CSS custom properties and Tailwind layers.

---

## Project Structure

```
src/
├── components/              # Reusable React components
│   ├── ui/                 # Shared UI library (AlertCard, etc.)
│   ├── export/             # Export-related components
│   └── Footer.tsx, Header.tsx, LoginModal.tsx, etc.
├── contexts/               # React Context providers (AuthContext, ToastContext)
├── hooks/                  # Custom React hooks (useAuth, useToast, useApiQuery, etc.)
├── lib/                    # Utilities (api.ts typed fetch wrapper)
├── modules/                # Feature modules (admin, warehouse-operator, etc.)
├── pages/                  # Page-level components (Dashboard, Login, etc.)
├── services/               # Domain service layers (authService, materialService, etc.)
├── types/                  # TypeScript interfaces (api.ts, export.ts, etc.)
├── utils/                  # Utility functions
├── test/                   # Test setup (MSW mocks)
├── App.tsx
├── index.css               # Global Tailwind + CSS layers
└── main.tsx
```

---

## API Integration Pattern

### 1. Document First in `docs/API_DOCUMENTATION.md`

Document all endpoints with clear request/response examples before implementation:

```markdown
### POST /materials

Creates a new material item.

| Parameter   | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| name        | string | Yes      | Material name        |
| description | string | No       | Optional description |

**Response:** `201 Created`
```

### 2. Define Types in `src/types/api.ts`

Derive interfaces directly from API docs:

```typescript
export interface Material {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  quantity: number;
  status: "available" | "borrowed" | "maintenance";
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialPayload {
  name: string;
  description?: string;
}

export type CreateMaterialResponse = Material;
```

### 3. Use `src/lib/api.ts` for All HTTP Calls

```typescript
import { post, get, patch, delete as apiDelete } from "../lib/api";
import type { ApiSuccessResponse } from "../lib/api";
import type { Material, CreateMaterialPayload } from "../types/api";

// All functions are typed end-to-end
export async function createMaterial(
  payload: CreateMaterialPayload,
): Promise<ApiSuccessResponse<Material>> {
  return post<Material, CreateMaterialPayload>("/materials", payload);
}

export async function getMaterial(id: string): Promise<ApiSuccessResponse<{ material: Material }>> {
  return get<{ material: Material }>(`/materials/${id}`);
}
```

### 4. Consume in Components via Service Layer

Always use services from React components; never call `fetch()` directly:

```typescript
import { createMaterial } from '../services/materialService';
import { useToast } from '../hooks/useToast';
import { useState } from 'react';

export function AddMaterialForm() {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createMaterial({ name: 'New Material' });
      showAlert('Material created', 'success');
    } catch (error) {
      showAlert('Failed to create material', 'error');
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Component Patterns

### UI Components (`src/components/ui/`)

Reusable, self-contained components exported from index barrel:

```typescript
// src/components/ui/StatCard.tsx

export interface StatCardProps {
  /** Card title. */
  title: string;
  /** Numeric or text value. */
  value: string | number;
  /** Optional description/subtext. */
  description?: string;
  /** Optional icon component. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional CSS class override. */
  className?: string;
}

/**
 * StatCard — Displays a single metric in a card.
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="form-label">{title}</p>
          <p className="text-2xl font-bold text-[#FFD700]">{value}</p>
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8 text-[#FFD700]" />}
      </div>
    </div>
  );
}

// src/components/ui/index.ts
export { AlertCard, type AlertCardProps } from './AlertCard';
export { StatCard, type StatCardProps } from './StatCard';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
// ... more exports
```

### Context Providers (`src/contexts/`)

Global state containers with hooks and consistency:

```typescript
// src/contexts/ToastContext.tsx

import { createContext, useCallback, useState, type ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// src/hooks/useToast.ts
import { useContext } from 'react';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
```

### Custom Hooks (`src/hooks/`)

Encapsulate reusable logic. Always return typed objects:

```typescript
// src/hooks/useApiQuery.ts

import { useState, useEffect } from "react";
import { ApiError } from "../lib/api";

export interface UseApiQueryOptions {
  skip?: boolean;
  refetchInterval?: number;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useApiQuery<T>(
  fn: () => Promise<{ data: T }>,
  deps: React.DependencyList = [],
  options: UseApiQueryOptions = {},
): UseApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const result = await fn();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Unknown error", 500, {}));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.skip) return;
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}
```

---

## Styling Conventions

### Tailwind Configuration (`tailwind.config.js`)

- Gold/neon theme: `#FFD700` (primary), dark backgrounds `#0f0f0f`, `#121212`, `#1a1a1a`.
- Extend with custom utilities only when necessary.
- Use Tailwind layers in `src/index.css` for global component classes (`.card`, `.btn-primary`, etc.).

### CSS Modules for Scoped Styles

Use when component-specific styles are complex:

```typescript
// src/components/Header.tsx
import styles from './Header.module.css';

export function Header() {
  return <header className={styles.header}>{/* ... */}</header>;
}
```

```css
/* src/components/Header.module.css */
.header {
  @apply bg-[#121212] border-b border-[#333] py-4;
}

.nav-link {
  @apply text-gray-300 hover:text-[#FFD700] transition-colors;
}
```

### Global Classes in `src/index.css`

Reusable utilities via Tailwind `@layer` directives:

```css
@layer components {
  .card {
    @apply bg-[#121212] border border-[#333] rounded-xl p-6;
  }

  .btn-primary {
    @apply bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50;
  }

  .badge-success {
    @apply bg-green-500/10 text-green-400 border border-green-500/30;
  }
}
```

---

## Error Handling

### API Errors

All API calls throw or return `ApiError` (from `src/lib/api.ts`):

```typescript
import { ApiError } from "../lib/api";

try {
  const response = await createMaterial(payload);
  // Use response.data
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error [${error.statusCode}]: ${error.message}`);
    // Handle specific status codes:
    if (error.statusCode === 409) {
      showAlert("Material already exists", "warning");
    } else if (error.statusCode === 403) {
      showAlert("You don't have permission", "error");
    }
  } else {
    console.error("Network or unknown error:", error);
  }
}
```

### Form Validation

Use TypeScript interfaces; validate before API calls:

```typescript
function validateMaterialForm(data: unknown): data is CreateMaterialPayload {
  if (typeof data !== "object" || data === null) return false;
  const { name } = data as Record<string, unknown>;
  return typeof name === "string" && name.trim().length > 0;
}

if (!validateMaterialForm(formData)) {
  showAlert("Please fill all required fields", "warning");
  return;
}
```

---

## Testing (`src/test/`, Vitest + MSW)

- Tests live beside modules: `src/services/__tests__/authService.test.ts`.
- Use MSW to mock API responses.
- All async operations must be awaited; use `async/await` or promises.

```typescript
// src/services/__tests__/materialService.test.ts

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { server } from "../../test/setup";
import { http, HttpResponse } from "msw";
import { createMaterial } from "../materialService";
import { ApiError } from "../../lib/api";

describe("materialService", () => {
  describe("createMaterial", () => {
    it("should create a material successfully", async () => {
      server.use(
        http.post("*/materials", () => {
          return HttpResponse.json({
            status: "success",
            data: { _id: "123", name: "Test Material" },
          });
        }),
      );

      const result = await createMaterial({ name: "Test Material" });
      expect(result.data._id).toBe("123");
    });

    it("should throw ApiError on conflict", async () => {
      server.use(
        http.post("*/materials", () => {
          return HttpResponse.json(
            { status: "error", message: "Material exists" },
            { status: 409 },
          );
        }),
      );

      await expect(createMaterial({ name: "Duplicate" })).rejects.toThrow(ApiError);
    });
  });
});
```

---

## PR Checklist

Before submitting code:

- ✅ **No `any` types** — all TypeScript is strict.
- ✅ **API calls via `src/lib/api.ts`** — no raw `fetch()`, axios, or external HTTP libs.
- ✅ **Types from `src/types/api.ts`** — derived from `docs/API_DOCUMENTATION.md`.
- ✅ **Components in `src/components/ui/`** — with JSDoc, prop interfaces, and accessible markup.
- ✅ **Services in `src/services/`** — one per domain entity, fully typed.
- ✅ **Error handling with `ApiError`** — not status code checks.
- ✅ **Tests pass** — `npm test` exits 0.
- ✅ **Lint clean** — `npm run lint` exits 0.
- ✅ **Format check** — `npm run format:check` exits 0.
- ✅ **No console.log** — debugging logs removed.
- ✅ **Responsive layout** — tested on mobile if applicable.
- ✅ **Documentation** — JSDoc comments, README updates if needed.
- ✅ **English only** — comments, docstrings, error messages in English.

---

## Environment Variables

All new environment variables must be:

1. Added to `.env.example`
2. Documented in `README.md`
3. Read in code via `import.meta.env.VITE_*` (Vite restriction: must start with `VITE_`)

---

## Useful Commands

```bash
npm run dev              # Start dev server with HMR
npm run build           # Type-check & production build
npm run lint            # ESLint check
npm run format          # Format with Prettier
npm run test            # Run Vitest once
npm run test:watch      # Interactive test mode
npm run test:coverage   # Coverage report
```

---

## Key Files Reference

| File                         | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `docs/API_DOCUMENTATION.md`  | **Single source of truth** for all API endpoints, payloads, responses |
| `src/lib/api.ts`             | Typed fetch wrapper; all HTTP calls go here                           |
| `src/types/api.ts`           | TypeScript interfaces derived from API docs                           |
| `src/services/*.ts`          | Domain service layers; one per entity                                 |
| `src/components/ui/index.ts` | Reusable component barrel export                                      |
| `src/contexts/`              | Global state (Auth, Toast, etc.)                                      |
| `src/hooks/`                 | Custom hooks for reusable logic                                       |
| `src/index.css`              | Global Tailwind layers and custom properties                          |
| `tailwind.config.js`         | Tailwind theme configuration                                          |
| `.eslintrc.cjs`              | Linting rules                                                         |
| `tsconfig.json`              | TypeScript configuration                                              |
