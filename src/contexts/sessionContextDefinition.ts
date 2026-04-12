import { createContext } from "react";
import type { SessionLogoutReason } from "../lib/sessionEvents";

export type SessionStatus =
  | "authenticated"
  | "refreshing"
  | "expired"
  | "idle-timeout"
  | "unauthenticated";

export interface SessionContextValue {
  sessionStatus: SessionStatus;
  lastActivityAt: number;
  warningOpen: boolean;
  logout: (reason?: SessionLogoutReason) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  markActivity: () => void;
}

export const defaultSessionContextValue: SessionContextValue = {
  sessionStatus: "unauthenticated",
  lastActivityAt: Date.now(),
  warningOpen: false,
  logout: async () => undefined,
  refreshSession: async () => false,
  markActivity: () => undefined,
};

export const SessionContext = createContext<SessionContextValue>(defaultSessionContextValue);
