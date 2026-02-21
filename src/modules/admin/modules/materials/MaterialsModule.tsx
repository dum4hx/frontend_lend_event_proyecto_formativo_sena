import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CreateMaterialPage } from "./pages";
import { MaterialCatalogPage } from "./pages";

/**
 * Materials Module Router
 * Handles internal routing for the Materials submodule
 */
export function MaterialsModule() {
  const [refreshCatalog, setRefreshCatalog] = useState(0);

  const handleMaterialCreated = () => {
    // Trigger catalog refresh
    setRefreshCatalog((prev) => prev + 1);
  };

  return (
    <Routes>
      {/* Main catalog view showing list of materials */}
      <Route
        path=""
        element={<MaterialCatalogPage key={refreshCatalog} />}
      />

      {/* Create new material form */}
      <Route
        path="create"
        element={<CreateMaterialPage onSuccess={handleMaterialCreated} />}
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
