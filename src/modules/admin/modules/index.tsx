import { useState } from "react";
import type React from "react";
import { CreateMaterialPage, MaterialCatalogPage } from "../modules/materials";

type MaterialViewType = "catalog" | "create";

/**
 * Materials Module Container
 * Manages navigation between catalog view and creation view
 */
export const MaterialsModule: React.FC = () => {
  const [currentView, setCurrentView] = useState<MaterialViewType>("catalog");

  return (
    <>
      {currentView === "catalog" && (
        <MaterialCatalogPage onCreateMaterial={() => setCurrentView("create")} />
      )}
      {currentView === "create" && (
        <CreateMaterialPage onNavigateBack={() => setCurrentView("catalog")} />
      )}
    </>
  );
};

export default MaterialsModule;
