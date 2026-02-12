/**
 * MSW (Mock Service Worker) server for Vitest.
 *
 * Import and start this server in individual test files or in the global
 * setup so that handlers intercept `fetch` calls automatically.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
