# LendEvent Frontend — Copilot Instructions

This workspace contains the **LendEvent** frontend application, a React 19 + TypeScript + Vite SPA for event rental management.

---

## Primary Reference

**All code changes, new features, and refactoring must follow:**

📋 [**LendEvent Frontend Coding Standards**](./lend-event-frontend.prompt.md)

This document defines:

- Project architecture and structure
- TypeScript conventions (strict, no `any`)
- API integration patterns (via `src/lib/api.ts`)
- Component design patterns
- Styling conventions (Tailwind + CSS Modules)
- Error handling standards
- Testing approach (Vitest + MSW)
- PR checklist

---

## Quick Reference Documentation

| Document                                                    | Purpose                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`docs/API_DOCUMENTATION.md`](../docs/API_DOCUMENTATION.md) | **Single source of truth** for all API endpoints, request/response schemas |
| [`README.md`](../README.md)                                 | Project setup, available scripts, architecture overview                    |
| [`src/types/api.ts`](../src/types/api.ts)                   | TypeScript interfaces derived from API documentation                       |
| [`src/lib/api.ts`](../src/lib/api.ts)                       | Typed fetch wrapper — all HTTP calls must use this                         |
| [`src/index.css`](../src/index.css)                         | Global styles, Tailwind layers, theme tokens                               |

---

## Key Conventions

### 🎯 Type Safety

- **No `any` types** — all code is strictly typed
- All interfaces derive from `src/types/api.ts`
- API types mirror `docs/API_DOCUMENTATION.md` exactly

### 🌐 API Integration

- All HTTP calls go through `src/lib/api.ts` (no raw `fetch`, axios, or other libs)
- One service file per domain entity in `src/services/`
- Error handling via `ApiError` class (not status code checks)

### 🎨 Components

- Reusable UI components in `src/components/ui/` with barrel export (`index.ts`)
- JSDoc comments on all component props
- Strict prop interfaces with TypeScript

### 💅 Styling

- Tailwind utility classes (primary: `#FFD700`, dark theme)
- CSS Modules for component-specific styles
- Global reusable classes defined in `src/index.css` via `@layer components`

### ✅ Quality Gates

Before any PR:

- `npm test` — all tests pass
- `npm run lint` — no ESLint errors
- `npm run format:check` — code is formatted
- No `console.log` statements
- English-only comments and documentation

---

## Common Tasks

### Adding a New API Endpoint

1. Document in `docs/API_DOCUMENTATION.md` first
2. Add TypeScript interfaces to `src/types/api.ts`
3. Create/update service in `src/services/`
4. Write tests in `src/services/__tests__/`
5. Consume from components using the service layer

### Creating a New UI Component

1. Create in `src/components/ui/ComponentName.tsx`
2. Define strict prop interface with JSDoc
3. Export from `src/components/ui/index.ts`
4. Use Tailwind classes or CSS Modules
5. Ensure keyboard accessibility (ARIA attributes, focus management)

### Adding a New Custom Hook

1. Create in `src/hooks/useHookName.ts`
2. Return typed object/array (not tuple unless necessary)
3. Include JSDoc explaining purpose and usage
4. Export from component or service consumers

---

## Development Workflow

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check types, lint, and format
npm run build && npm run lint && npm run format:check
```

---

## When in Doubt

1. Check [lend-event-frontend.prompt.md](./lend-event-frontend.prompt.md) for detailed patterns
2. Refer to [docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) for API contracts
3. Look at existing implementations in `src/services/` and `src/components/ui/`
4. Follow the PR checklist before committing

---

**Last Updated:** March 6, 2026
