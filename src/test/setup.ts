/**
 * Global test setup — loaded by Vitest before every test file.
 *
 * - Polyfills `import.meta.env` so the API wrapper can read `VITE_API_BASE_URL`.
 * - Extends `expect` with `@testing-library/jest-dom` matchers.
 */

import "@testing-library/jest-dom/vitest";

// Provide a deterministic base URL for tests.
(import.meta as Record<string, unknown>).env = {
  ...(import.meta.env ?? {}),
  VITE_API_BASE_URL: "http://localhost:3000/api/v1",
};
