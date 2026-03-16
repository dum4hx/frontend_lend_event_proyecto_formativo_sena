# SKILL: Impact & Regression Diagnosis

Perform a systematic diagnosis of new system updates to identify breaking changes, dependency failures, and regression risks.

## Workflow

### 1. Identify Change Scope

- Locate the modified files (use `get_changed_files` or user-provided list).
- Map the internal dependencies using `vscode_listCodeUsages` for exported symbols.
- Identify the system boundary: Is it an API change, a UI component change, or a utility change?

### 2. Dependency Analysis

- **Direct Consumers**: Check all files importing the modified symbol.
- **Side Effects**: Identify if the change affects global state (`AuthContext`, `ToastContext`), shared hooks, or API contracts in `src/lib/api.ts`.
- **API Contracts**: If a service in `src/services/` changed, verify if it still matches the schema in `docs/API_DOCUMENTATION.md`.

### 3. Execution & Verification

- **Unit Tests**: Run relevant tests in `src/services/__tests__/` or `src/lib/__tests__/` (using `npm test`).
- **MSW Mocks**: If API changes were made, ensure `src/test/mocks/server.ts` handles the response according to `docs/API_DOCUMENTATION.md`.
- **Type Check**: Execute `npm run build` or use the language server (Pylance/TypeScript) to find immediate regressions.
- **Linting**: Check for new violations using `npm run lint`.

### 4. Failure Reporting

Generate a structured report:

- **Change Summary**: Brief description of the update.
- **Affected Areas**: List of files/modules mapped in Step 1.
- **Failed Components**: Specific symbols, features, or UI layouts that are broken.
- **Root Cause**: Explanation (e.g., "type mismatch", "missing prop", "API schema deviation", "Zod validation fail").

### 5. Solution Plan

Provide a step-by-step remediation:

- **Immediate Fixes**: Code changes to restore baseline functionality.
- **Consumer Updates**: Necessary shifts for files importing the modified symbol.
- **Regression Tests**: New test cases or Vitest mock updates to prevent recurrence.
- **Docs Update**: Reflect changes in `docs/API_DOCUMENTATION.md` or `QUICK_START_GUIDE.md` if applicable.

## Principles

- **No `any`**: Ensure no type safety is lost in the fix.
- **Strict Fetch**: Ensure `src/lib/api.ts` patterns are followed.
- **Tailwind Compliance**: Verify that UI changes use the theme tokens (#FFD700).
- **Minimal Impact**: Prefer backward-compatible migrations when possible.
