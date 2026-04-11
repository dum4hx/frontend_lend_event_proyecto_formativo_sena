import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { MaterialType, MaterialCategory } from "../../types/api";
import Button from "./Button";

export interface MaterialSelectorProps {
  categories: MaterialCategory[];
  materials: MaterialType[];
  onAddMaterials: (materials: MaterialType[]) => void;
  /**
   * Get availability info for a material. Return undefined if data not available.
   * Used to show stock status and disable unavailable items.
   */
  getAvailabilityLabel?: (
    materialId: string,
  ) => { text: string; tone: "neutral" | "success" | "warning" | "danger" } | undefined;
  getMaterialUsageCount?: (materialId: string) => number;
  formatPrice?: (price: number) => string;
  singleSelect?: boolean;
  title?: string;
  recentMaterials?: MaterialType[];
  showPrice?: boolean;
  /** Current language for i18n ("en" | "es"). Defaults to "en". */
  language?: "en" | "es";
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getMaterialSearchScore(material: MaterialType, normalizedQuery: string): number {
  if (!normalizedQuery) return 1;

  const normalizedName = normalizeSearchText(material.name);
  const normalizedDescription = normalizeSearchText(material.description);

  if (normalizedName.startsWith(normalizedQuery)) return 5;
  if (normalizedName.includes(normalizedQuery)) return 4;
  if (normalizedDescription.startsWith(normalizedQuery)) return 3;
  if (normalizedDescription.includes(normalizedQuery)) return 2;

  return 0;
}

function getAvailabilityBadgeClass(tone: "neutral" | "success" | "warning" | "danger"): string {
  if (tone === "success") return "bg-green-500/15 text-green-300 border border-green-500/30";
  if (tone === "warning") return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30";
  if (tone === "danger") return "bg-red-500/15 text-red-300 border border-red-500/30";
  return "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30";
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  categories,
  materials,
  onAddMaterials,
  getAvailabilityLabel,
  getMaterialUsageCount,
  formatPrice,
  singleSelect = false,
  title,
  recentMaterials = [],
  showPrice = true,
  language = "en",
}) => {
  const isEs = language === "es";
  const resolvedTitle = title ?? (isEs ? "Selector rápido de materiales" : "Quick Material Picker");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchTerm);
    return materials
      .filter((material) => {
        if (categoryId) {
          const materialCategory = material.categoryId as unknown;
          const materialsInCategory = Array.isArray(materialCategory)
            ? materialCategory
            : [materialCategory];
          if (
            !materialsInCategory.some((cat) => {
              const catId = typeof cat === "string" ? cat : (cat as { _id?: string })?._id;
              return catId === categoryId;
            })
          ) {
            return false;
          }
        }
        return getMaterialSearchScore(material, normalizedQuery) > 0;
      })
      .sort((a, b) => {
        const aScore = getMaterialSearchScore(a, normalizedQuery);
        const bScore = getMaterialSearchScore(b, normalizedQuery);
        if (aScore !== bScore) return bScore - aScore;

        const aUsage = getMaterialUsageCount?.(a._id) ?? 0;
        const bUsage = getMaterialUsageCount?.(b._id) ?? 0;
        if (aUsage !== bUsage) return bUsage - aUsage;

        return a.name.localeCompare(b.name);
      })
      .slice(0, 50);
  }, [materials, categoryId, searchTerm, getMaterialUsageCount]);

  const isMaterialSelectable = useCallback(
    (materialId: string): boolean => {
      const availability = getAvailabilityLabel?.(materialId);
      if (!availability) return true;
      return availability.tone !== "danger";
    },
    [getAvailabilityLabel],
  );

  const handleToggleMaterial = (materialId: string) => {
    if (singleSelect) {
      setSelectedMaterialIds([materialId]);
    } else {
      setSelectedMaterialIds((prev) =>
        prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId],
      );
    }
  };

  const handleAddSelected = () => {
    const toAdd = materials.filter((m) => selectedMaterialIds.includes(m._id));
    if (toAdd.length > 0) {
      onAddMaterials(toAdd);
      setSelectedMaterialIds([]);
      setSearchTerm("");
    }
  };

  const handleAddSingle = (material: MaterialType) => {
    onAddMaterials([material]);
    setSelectedMaterialIds([]);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const firstResult = filteredMaterials.find((m) => isMaterialSelectable(m._id));
    if (!firstResult) return;
    e.preventDefault();
    handleAddSingle(firstResult);
  };

  return (
    <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 space-y-3">
      <p className="text-sm font-semibold text-white">{resolvedTitle}</p>

      {recentMaterials.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {isEs ? "Usados recientemente" : "Recently Used"}
          </p>
          <div className="flex flex-wrap gap-2">
            {recentMaterials.map((material) => (
              <Button
                key={`recent-${material._id}`}
                variant="secondary"
                size="sm"
                onClick={() => handleAddSingle(material)}
                title={isEs ? `Agregar ${material.name}` : `Add ${material.name}`}
                disabled={!isMaterialSelectable(material._id)}
                className={
                  !isMaterialSelectable(material._id) ? "border-red-500/30 text-red-300" : ""
                }
              >
                {material.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]"
      >
        <option value="">{isEs ? "Todas las categorías" : "All categories"}</option>
        {categories.map((category) => (
          <option key={`selector-category-${category._id}`} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>

      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isEs
            ? "Buscar material por nombre o descripción..."
            : "Search material by name or description..."
        }
        className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700] placeholder-gray-600"
      />
      <p className="text-[11px] text-gray-500">
        {isEs
          ? "Consejo: Presiona Ctrl/Cmd + K para enfocar la búsqueda, luego Enter para agregar el primer resultado."
          : "Tip: Press Ctrl/Cmd + K to focus search, then Enter to add the first result."}
      </p>

      <p className="text-[11px] text-gray-500">
        {isEs
          ? `${filteredMaterials.length} resultado${filteredMaterials.length === 1 ? "" : "s"} en tiempo real`
          : `${filteredMaterials.length} result${filteredMaterials.length === 1 ? "" : "s"} in real time`}
      </p>

      <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
        {filteredMaterials.length === 0 ? (
          <p className="text-xs text-gray-500">
            {isEs
              ? "No se encontraron materiales para los filtros actuales."
              : "No materials found for current filters."}
          </p>
        ) : (
          filteredMaterials.map((material) => {
            const selected = selectedMaterialIds.includes(material._id);
            const isSelectable = isMaterialSelectable(material._id);
            return (
              <label
                key={`selector-material-${material._id}`}
                className={`flex items-start gap-2 text-xs p-2 rounded-md border cursor-pointer transition ${
                  isSelectable ? "border-[#333] bg-[#151515]" : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggleMaterial(material._id)}
                  className="mt-0.5 cursor-pointer"
                  disabled={!isSelectable}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-gray-100 truncate">{material.name}</span>
                  <span className="block text-gray-400 truncate">{material.description}</span>
                  {showPrice && formatPrice && (
                    <span className="block text-gray-400 truncate">
                      {formatPrice(material.pricePerDay)} / {isEs ? "día" : "day"}
                    </span>
                  )}
                  {(() => {
                    const availability = getAvailabilityLabel?.(material._id);
                    if (!availability) return null;
                    return (
                      <span
                        className={`mt-1 inline-flex text-[11px] px-1.5 py-0.5 rounded ${getAvailabilityBadgeClass(availability.tone)}`}
                      >
                        {availability.text}
                      </span>
                    );
                  })()}
                  {(() => {
                    const count = getMaterialUsageCount?.(material._id) ?? 0;
                    if (count <= 0) return null;
                    return (
                      <span className="block text-[11px] text-[#FFD700] truncate">
                        {isEs ? `Usado ${count} veces` : `Used ${count} times`}
                      </span>
                    );
                  })()}
                </span>
              </label>
            );
          })
        )}
      </div>

      {!singleSelect && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddSelected}
          className="w-full"
          disabled={selectedMaterialIds.length === 0}
        >
          {isEs
            ? `Agregar items seleccionados (${selectedMaterialIds.length})`
            : `Add selected items (${selectedMaterialIds.length})`}
        </Button>
      )}
    </div>
  );
};
