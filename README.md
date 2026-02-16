# LendEvent — Frontend

React 19 + TypeScript + Vite SPA for the **LendEvent** event-rental management platform.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and adjust as needed
cp .env.example .env

# 3. Start the dev server
npm run dev
```

## Environment variables

| Variable            | Description                        | Default                        |
| ------------------- | ---------------------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | Base URL of the LendEvent REST API | `http://api.test.local/api/v1` |

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
import { exportService, PLAN_CONFIGURATION_POLICY } from './services/export';
import type { ExportConfig } from './types/export';

const config: ExportConfig = {
  format: 'xlsx',
  module: 'plan-configuration',
  selectedFields: ['plan', 'displayName', 'baseCost', 'status'],
  includeAuditMetadata: true,
  fullExport: false,
};

const result = await exportService.export(rawData, config, userId);
```

### Architecture

| Layer | File | Responsibility |
| --- | --- | --- |
| Types | `src/types/export.ts` | All export-related TypeScript interfaces |
| Redaction | `src/services/export/redaction.ts` | PII pseudonymization/exclusion policies per module |
| Validation | `src/services/export/validation.ts` | Runtime payload validation |
| Checksum | `src/services/export/checksum.ts` | SHA-256 hashing via Web Crypto API |
| PDF Adapter | `src/services/export/adapters/pdfAdapter.ts` | Minimal PDF-1.4 generator (no dependencies) |
| Excel Adapter | `src/services/export/adapters/excelAdapter.ts` | Minimal XLSX generator (no dependencies) |
| Service | `src/services/export/exportService.ts` | Orchestrates redaction → validation → adapter |

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
import { AlertContainer } from './components/ui';
import { useAlerts } from './hooks/useAlerts';

const { alerts, showAlert, dismissAlert } = useAlerts();
showAlert('success', 'Export completed!');

<AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />
```

### Demo page

Visit `/export-demo` for a manual QA page exercising exports and alert cards.
