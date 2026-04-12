import type { ApiError } from "./api";

export type SessionLogoutReason =
  | "INACTIVITY_TIMEOUT"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "SESSION_NOT_FOUND"
  | "MISSING_REFRESH_TOKEN"
  | "UNAUTHORIZED"
  | "MANUAL";

export interface SessionAuthFailureEvent {
  code: SessionLogoutReason;
  error: ApiError;
}

interface SessionEventHandlers {
  onAuthFailure?: (event: SessionAuthFailureEvent) => void;
}

let handlers: SessionEventHandlers = {};

export function registerSessionEventHandlers(nextHandlers: SessionEventHandlers): void {
  handlers = nextHandlers;
}

export function emitSessionAuthFailure(event: SessionAuthFailureEvent): void {
  handlers.onAuthFailure?.(event);
}

export function getSessionLogoutMessage(code: SessionLogoutReason): string {
  switch (code) {
    case "INACTIVITY_TIMEOUT":
      return "Tu sesion se cerro por inactividad.";
    case "SESSION_EXPIRED":
      return "Tu sesion expiro. Inicia sesion de nuevo.";
    case "SESSION_REVOKED":
    case "SESSION_NOT_FOUND":
      return "Tu sesion ya no es valida.";
    case "MISSING_REFRESH_TOKEN":
      return "Necesitas iniciar sesion nuevamente.";
    default:
      return "Tu sesion finalizo. Inicia sesion nuevamente.";
  }
}
