/**
 * EntityDetailProvider
 *
 * Provides a global mechanism to open detail modals for any entity by type + ID,
 * from anywhere inside the app — including from within other detail modals.
 *
 * Usage:
 *   const { openEntityDetail } = useEntityDetail();
 *   openEntityDetail("customer", customerId);
 */

import React, { useState, useCallback, lazy, Suspense, useEffect } from "react";
import { EntityDetailContext } from "./entityDetailContextDefinition";
import type { EntityType } from "./entityDetailContextDefinition";
import { LoadingSpinner } from "../components/ui";
import { AUTH_SESSION_CLEARED_EVENT } from "../utils/authRoutePolicy";

interface ActiveEntity {
  type: EntityType;
  id: string;
}

// Lazy-load launchers to avoid circular deps and reduce initial bundle
const CustomerDetailLauncher = lazy(() => import("./entityDetailLaunchers/CustomerDetailLauncher"));
const MaterialTypeDetailLauncher = lazy(
  () => import("./entityDetailLaunchers/MaterialTypeDetailLauncher"),
);
const MaterialInstanceDetailLauncher = lazy(
  () => import("./entityDetailLaunchers/MaterialInstanceDetailLauncher"),
);
const LocationDetailLauncher = lazy(() => import("./entityDetailLaunchers/LocationDetailLauncher"));
const CategoryDetailLauncher = lazy(() => import("./entityDetailLaunchers/CategoryDetailLauncher"));
const TransferRequestDetailLauncher = lazy(
  () => import("./entityDetailLaunchers/TransferRequestDetailLauncher"),
);

export function EntityDetailProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveEntity | null>(null);

  const openEntityDetail = useCallback((type: EntityType, id: string) => {
    if (!id) return;
    setActive({ type, id });
  }, []);

  const closeEntityDetail = useCallback(() => {
    setActive(null);
  }, []);

  useEffect(() => {
    function handleSessionCleared(): void {
      closeEntityDetail();
    }

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    };
  }, [closeEntityDetail]);

  return (
    <EntityDetailContext.Provider value={{ openEntityDetail, closeEntityDetail }}>
      {children}
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {active?.type === "customer" && (
          <CustomerDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
        {active?.type === "materialType" && (
          <MaterialTypeDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
        {active?.type === "materialInstance" && (
          <MaterialInstanceDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
        {active?.type === "location" && (
          <LocationDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
        {active?.type === "category" && (
          <CategoryDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
        {active?.type === "transferRequest" && (
          <TransferRequestDetailLauncher id={active.id} onClose={closeEntityDetail} />
        )}
      </Suspense>
    </EntityDetailContext.Provider>
  );
}
