import { createContext } from "react";

export type EntityType =
  | "customer"
  | "materialType"
  | "materialInstance"
  | "location"
  | "category"
  | "transferRequest";

export interface EntityDetailContextValue {
  /** Open the detail modal for the given entity. */
  openEntityDetail: (type: EntityType, id: string) => void;
  /** Close the currently open entity detail modal. */
  closeEntityDetail: () => void;
}

export const EntityDetailContext = createContext<EntityDetailContextValue | undefined>(undefined);
