# LendEvent Frontend — Copilot Instructions

This workspace contains the **LendEvent** frontend application, a React 19 + TypeScript + Vite SPA for event rental management.

---

## Primary Reference

**All code changes, new features, and refactoring must follow:**

📋 [**LendEvent Frontend Coding Standards**](./instructions/lend-event-frontend.prompt.md)

This document defines:

- Project architecture and structure
- TypeScript conventions (strict, DO NOT use type `any`, always use interfaces, types, enums, etc)
- API integration patterns (via `src/lib/api.ts`)
- Component design patterns
- Styling conventions (Tailwind + CSS Modules)
- Error handling standards
- Testing approach (Vitest + MSW)
- PR checklist

---

## Quick Reference Documentation

| Document                                                                              | Purpose                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`docs/API_DOCUMENTATION.md`](../docs/API_DOCUMENTATION.md)                           | **Single source of truth** for all API endpoints, request/response schemas |
| [`README.md`](../README.md)                                                           | Project setup, available scripts, architecture overview                    |
| [`src/types/api.ts`](../src/types/api.ts)                                             | TypeScript interfaces derived from API documentation                       |
| [`src/lib/api.ts`](../src/lib/api.ts)                                                 | Typed fetch wrapper — all HTTP calls must use this                         |
| [`src/index.css`](../src/index.css)                                                   | Global styles, Tailwind layers, theme tokens                               |
| [`src/i18n/locales/`](../src/i18n/locales/)                                           | Translation JSON files (`en/` + `es/`) — both must be updated together     |
| [`src/modules/app/help/types.ts`](../src/modules/app/help/types.ts)                   | TypeScript interfaces for all help content (`HelpModuleContent`, etc.)     |
| [`src/modules/app/help/moduleResolver.ts`](../src/modules/app/help/moduleResolver.ts) | Maps route prefixes to help module IDs                                     |
| [`src/modules/app/help/content/`](../src/modules/app/help/content/)                   | One help content file per module — always keep in sync with views          |

---

## Key Conventions

### 🎯 Type Safety

- **DO NOT UNDER ANY CIRCUMSTANCE use `any` types** — all code is strictly typed, create custom types or derive from existing interfaces as needed
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

### 🔐 Permission Guards

Every action button (create, edit, delete, approve, etc.) **must** be integrated with the permission guard system. Rendering an action button without gating it behind the appropriate permission is a blocking defect.

#### Available tools

| Tool                      | Location                                        | When to use                                                             |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `PermissionGuardedButton` | `src/components/ui/PermissionGuardedButton.tsx` | Icon-style action buttons in tables and detail panels                   |
| `useActionPermission`     | `src/hooks/useActionPermission.ts`              | Custom buttons / inline elements that are not `PermissionGuardedButton` |
| `usePermissions`          | `src/contexts/usePermissions.ts`                | Conditional rendering (show/hide entire sections)                       |
| `RequirePermission`       | `src/utils/permissionGuard.tsx`                 | Route-level access guard (wraps a whole page)                           |

#### Rules

1. **Prefer `PermissionGuardedButton`** for icon-based row actions (edit, delete, view, approve, reject). It handles `aria-disabled`, the denied toast, and the lock badge automatically.
2. **Use `useActionPermission`** for primary call-to-action buttons (e.g. "Create", "Export") that are not `PermissionGuardedButton`. Always derive the locale from `useLanguage()`:
   ```tsx
   const { language } = useLanguage();
   const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");
   ```
3. **Never use `disabled` on guarded buttons.** Use `aria-disabled={!isAllowed("perm:key")}` and render the denied state visually with `opacity-50 cursor-not-allowed` so click events still reach the toast handler.
4. **Use `usePermissions`** (`hasPermission` / `hasAnyPermission`) only for conditional rendering of entire sections, not for individual button actions.
5. **Match the exact permission key** from `docs/PERMISSIONS_REFERENCE.md`. Never invent permission keys. Consult the table below.
6. **Route guards** (`RequirePermission`) are already set up for pages — do not re-check the read permission inside the page body; only gate write/mutating actions.

#### Permission key reference

| Module              | Read                       | Create                       | Update                       | Delete                       | Special                                                           |
| ------------------- | -------------------------- | ---------------------------- | ---------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Analytics           | `analytics:read`           | —                            | —                            | —                            | —                                                                 |
| Customers           | `customers:read`           | `customers:create`           | `customers:update`           | `customers:delete`           | —                                                                 |
| Users / Team        | `users:read`               | `users:create`               | `users:update`               | `users:delete`               | —                                                                 |
| Roles               | `roles:read`               | `roles:create`               | `roles:update`               | `roles:delete`               | —                                                                 |
| Permissions         | `permissions:read`         | `permissions:create`         | `permissions:update`         | `permissions:delete`         | —                                                                 |
| Organization        | `organization:read`        | —                            | `organization:update`        | `organization:delete`        | —                                                                 |
| Materials           | `materials:read`           | `materials:create`           | `materials:update`           | `materials:delete`           | —                                                                 |
| Material Attributes | `material_attributes:read` | `material_attributes:create` | `material_attributes:update` | `material_attributes:delete` | —                                                                 |
| Maintenance         | `maintenance:read`         | `maintenance:create`         | `maintenance:update`         | `maintenance:delete`         | `maintenance:resolve`                                             |
| Inspections         | `inspections:read`         | `inspections:create`         | `inspections:update`         | —                            | —                                                                 |
| Incidents           | `incidents:read`           | `incidents:create`           | `incidents:update`           | —                            | `incidents:acknowledge`, `incidents:resolve`, `incidents:dismiss` |
| Operations          | `operations:read`          | —                            | —                            | —                            | —                                                                 |
| Orders / Requests   | `requests:read`            | `requests:create`            | `requests:update`            | `requests:delete`            | `requests:approve`                                                |
| Rentals / Loans     | `loans:read`               | `loans:create`               | `loans:update`               | —                            | `loans:checkout`, `loans:return`                                  |
| Invoices            | `invoices:read`            | `invoices:create`            | `invoices:update`            | —                            | —                                                                 |
| Packages            | `packages:read`            | `packages:create`            | `packages:update`            | `packages:delete`            | —                                                                 |
| Transfers           | `transfers:read`           | `transfers:create`           | `transfers:update`           | —                            | `transfer_rejection_reasons:manage`                               |
| Pricing             | `pricing:read`             | —                            | —                            | —                            | —                                                                 |
| Payment Methods     | `payment_methods:read`     | —                            | —                            | —                            | —                                                                 |
| Code Schemes        | `code_schemes:read`        | `code_schemes:create`        | `code_schemes:update`        | `code_schemes:delete`        | —                                                                 |
| Reports             | `reports:read`             | —                            | —                            | —                            | —                                                                 |
| Subscription        | —                          | —                            | —                            | —                            | `subscription:manage`, `billing:manage`                           |
| Subscription Types  | `subscription_types:read`  | `subscription_types:create`  | `subscription_types:update`  | `subscription_types:delete`  | —                                                                 |
| Super Admin         | —                          | —                            | —                            | —                            | `platform:manage`                                                 |

#### Pattern examples

```tsx
// Icon button in a table row — preferred
<PermissionGuardedButton
  icon={Pencil}
  intent="edit"
  ariaLabel="Edit customer"
  requiredPermission="customers:update"
  onClick={() => openEdit(customer)}
/>

<PermissionGuardedButton
  icon={Trash2}
  intent="delete"
  ariaLabel="Delete customer"
  requiredPermission="customers:delete"
  onClick={() => openDelete(customer)}
/>

// Primary create button — use useActionPermission
const { language } = useLanguage();
const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");

<button
  onClick={guard("customers:create", () => setCreateOpen(true))}
  aria-disabled={!isAllowed("customers:create")}
  className={`btn-primary ${!isAllowed("customers:create") ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {t("common.create")}
</button>

// Special actions (approve, checkout, resolve…)
<PermissionGuardedButton
  icon={CheckCircle}
  intent="approve"
  ariaLabel="Approve request"
  requiredPermission="requests:approve"
  onClick={() => approveRequest(request.id)}
/>
```

### ✅ Quality Gates

Before any PR:

- `npm test` — all tests pass
- `npm run lint` — no ESLint errors
- `npm run format:check` — code is formatted
- No `console.log` statements
- English-only comments and documentation
- All user-visible strings use `t()` from `useLanguage()`; both `en` and `es` locale files updated
- Help content file for the modified module is created/updated with bilingual `HelpText` values, walkthrough steps, and form guides
- JSX elements targeted by help selectors carry `data-help-id` attributes
- Every action button is guarded with the correct permission key via `PermissionGuardedButton` or `useActionPermission`

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

## Internationalisation (i18n) — MANDATORY on Every View Change

Every view addition or modification **must** fully support the `LanguageContext` (`src/contexts/LanguageContext.tsx`). Failure to do so is a blocking defect.

### How the system works

- `useLanguage()` (`src/contexts/useLanguage.ts`) exposes `t`, `formatDate`, `formatNumber`, `formatCurrency`, `language`, `locale`.
- Translation keys are defined in JSON locale files under `src/i18n/locales/en/` and `src/i18n/locales/es/`.
  Supported namespaces: `common`, `nav`, `publicSite`, `settings`, `superAdmin`, `systemSettings`.
- `TranslationKey` (`src/i18n/translations.ts`) is derived automatically from the English locale — it is the single source of truth.
- `t(key, params?)` returns the translated string for the active language (`"en"` | `"es"`).

### Rules

1. **No hard-coded user-visible strings.** All labels, titles, placeholders, error messages, and button text must use `t("some.key")`.
2. **Add both locales together.** When a new key is added to `src/i18n/locales/en/<namespace>.json`, the matching translation must be added to `src/i18n/locales/es/<namespace>.json` in the same commit.
3. **Use `formatDate`, `formatNumber`, `formatCurrency`** for all formatted values — never `new Intl.*` directly inside components, and never hard-code currency symbols or date formats.
4. Call `useLanguage()` at the component level; do not pass raw `language` strings down the tree as props unless necessary for serialisation.
5. Pick the correct namespace (e.g. `common.*` for shared terms, `nav.*` for sidebar labels). Create a new namespace file only when an existing namespace clearly does not fit.

### Checklist for every view change

- [ ] All visible strings go through `t()`
- [ ] Both `en` and `es` JSON files updated
- [ ] Dates, numbers, and currencies use the `LanguageContext` formatters
- [ ] No `console.log` exposes translation state

---

## Contextual Help (HelpPanel) — MANDATORY on Every View Change

Every view addition or modification **must** include or update a corresponding help module so that `HelpPanel` (`src/modules/app/help/HelpPanel.tsx`) shows contextual guidance. Failure to do so is a blocking defect.

### How the system works

- `HelpPanel` reads the active route, resolves the matching `HelpModuleDefinition` in `src/modules/app/help/moduleResolver.ts`, and lazy-loads the corresponding content file from `src/modules/app/help/content/<moduleId>Help.ts`.
- Each content file exports a `HelpModuleContent` object (typed in `src/modules/app/help/types.ts`) with:
  - `moduleId` — matches the key in `moduleResolver.ts`.
  - `title` / `description` — `HelpText` (plain string **or** `{ en: string; es: string }`).
  - `sections` — array of `HelpContentSection` (id, title, body, tips, warnings, bestPractices).
  - `walkthrough` — ordered array of `HelpWalkthroughStep` (id, title, body, optional `targetSelector` CSS selector).
  - `formGuides` — optional array of `HelpFormGuide` describing every interactive form.
- **`data-help-id` anchors**: interactive elements that a walkthrough step or form-field guide targets must carry a `data-help-id="<unique-id>"` attribute so that `targetSelector` / `selector` values like `[data-help-id="my-form-create"]` resolve correctly at runtime.
- `HelpPanel` auto-detects focused form fields via `focusin` events and displays an inline field tooltip for any `HelpFormFieldGuide` whose `selector` matches the focused element — so every significant form field should have a `selector`.
- `HelpPanelContext` (`src/modules/app/help/HelpPanelContext.tsx`) is provided above the router; `useHelpPanel()` is available anywhere inside the app layout.

### Rules

1. **New route/page → new or updated help content file.** If the page belongs to an existing `moduleId`, update the existing file. If it requires a new `moduleId`, add the definition to `moduleResolver.ts` and create `src/modules/app/help/content/<moduleId>Help.ts`.
2. **Localize all help text.** Use `{ en: "…", es: "…" }` objects (not plain strings) for every `HelpText` field so the panel language switches with `LanguageContext`.
3. **Walkthrough coverage.** Add at least one `HelpWalkthroughStep` per major UI section. Use `targetSelector: '[data-help-id="<id>"]'` to highlight the relevant element.
4. **Form guides.** Every create/edit form must have a matching `HelpFormGuide` entry with:
   - One `HelpFormFieldGuide` per significant input (include `selector`, `required`, `dataType`, and `example`).
   - One `HelpFormActionGuide` per submit/cancel button.
   - Use `createCrudFormGuides` from `src/modules/app/help/formGuideTemplates.ts` when both create and edit forms exist.
5. **`data-help-id` anchors are required** on any element referenced by a `targetSelector` or field `selector`. Add them alongside the JSX change — never as a follow-up.
6. Do **not** couple help content to API calls. Content files are static typed objects; keep them free of async logic.

### Checklist for every view change

- [ ] `moduleResolver.ts` has a matching `routePrefixes` entry
- [ ] `src/modules/app/help/content/<moduleId>Help.ts` exists and is updated
- [ ] All `HelpText` values use `{ en, es }` objects
- [ ] Every major section has a walkthrough step with a `targetSelector`
- [ ] Every form has a `HelpFormGuide` with field and action guides
- [ ] Affected JSX elements carry `data-help-id` anchors

---

## When in Doubt

1. Check [lend-event-frontend.prompt.md](./instructions/lend-event-frontend.prompt.md) for detailed patterns
2. Refer to [docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) for API contracts
3. Look at existing implementations in `src/services/` and `src/components/ui/`
4. Follow the PR checklist before committing

---

**Last Updated:** April 6, 2026

---

## Commit Guidelines

Add commits frequently and meaningfully. Commit locally (do not push or open PRs by default) and keep each commit focused on a single logical change.

When to commit:

- Commit early for small, self-contained changes (one logical change per commit).
- Commit whenever a task reaches a verifiable state (builds, passes unit tests, or adds a test).
- Commit when you finish implementing a single behavior, refactor, or bugfix — avoid mixing unrelated changes.

Branching (Gitflow basics):

- `main`: always production-ready. Only release merges go here.
- `develop`: integration branch for completed features; CI must pass before merging to `develop`.
- `feature/<short-description>`: created off `develop` for new features or tasks. Merge back into `develop` when complete.
- `hotfix/<short-description>`: created off `main` to fix production issues; merge into both `main` and `develop` after review.
- `release/<version>`: optional branch from `develop` for preparing a release; merge into `main` and `develop`.

Commit message standard (short + details):

- Use a short, imperative summary line (<= 72 chars). Example: `feat(auth): add magic-link login flow`
- After the summary line, include a blank line, then a bullet list with details:
  - **Scope**: what part of the app was changed (e.g., `authService`, `Login.tsx`).
  - **What**: short list of what was done (one bullet per item).
  - **Why / Purpose**: reason for the change and any relevant context.
  - **Testing**: what was tested (unit, manual steps) and any required post-merge actions.

Example commit message:

```
fix(materials): prevent duplicate category creation

- Scope: materialService.ts, CreateCategoryForm.tsx
- What: added server-side duplicate check; client shows inline error message
- Why / Purpose: prevents creating identical categories which caused downstream errors
- Testing: unit test added for duplicate check; manual test: create category flow
```

Tips:

- Keep commits focused and reversible. Squash or rebase feature branch commits before merging if they are WIP or noisy.
- Use `git rebase -i` to tidy history on feature branches before merging.
- Reference issue/ticket numbers in the commit message when applicable.

If unsure, follow the examples above or ask a teammate for guidance.
