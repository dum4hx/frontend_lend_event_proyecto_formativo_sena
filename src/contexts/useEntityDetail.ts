import { useContext } from "react";
import { EntityDetailContext } from "./entityDetailContextDefinition";
import type { EntityDetailContextValue } from "./entityDetailContextDefinition";

export function useEntityDetail(): EntityDetailContextValue {
  const ctx = useContext(EntityDetailContext);
  if (!ctx) {
    throw new Error("useEntityDetail must be used inside <EntityDetailProvider>");
  }
  return ctx;
}
