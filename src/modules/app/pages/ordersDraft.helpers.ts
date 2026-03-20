import type { MaterialType } from "../../../types/api";

export type FormDraftItem = {
  localId: string;
  categoryId: string;
  materialTypeId: string;
  materialSearchTerm: string;
  quantity: string;
};

export type DraftMaterialSelection = {
  material: MaterialType;
  quantity: number;
};

function extractCategoryId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return (first as { _id?: string })._id;
  }
  if (value && typeof value === "object") return (value as { _id?: string })._id;
  return undefined;
}

export function isFormDraftItemEmpty(item: FormDraftItem): boolean {
  return !item.categoryId && !item.materialTypeId && !item.materialSearchTerm.trim();
}

export function calculateRentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;

  // If time is missing, add it to ensure stable parsing
  const startFull = startDate.includes("T") ? startDate : `${startDate}T00:00:00`;
  const endFull = endDate.includes("T") ? endDate : `${endDate}T00:00:00`;

  const start = new Date(startFull);
  const end = new Date(endFull);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diffTime = end.getTime() - start.getTime();

  // If exactly same or very close (less than 1s), count as 1 day
  if (diffTime < 1000) return 1;

  // Count partial days as a full day (ceil)
  return Math.ceil(diffTime / millisecondsPerDay);
}

export function mergeSelectionsIntoDraftRows(
  currentItems: FormDraftItem[],
  selections: DraftMaterialSelection[],
): FormDraftItem[] {
  const next = [...currentItems];

  for (const { material, quantity } of selections) {
    const normalizedQuantity = Math.max(1, Math.floor(quantity || 1));
    const existingIndex = next.findIndex((row) => row.materialTypeId === material._id);

    if (existingIndex >= 0) {
      const currentQuantity = Number(next[existingIndex].quantity);
      const safeCurrentQuantity =
        Number.isFinite(currentQuantity) && currentQuantity > 0 ? currentQuantity : 1;
      next[existingIndex] = {
        ...next[existingIndex],
        categoryId: extractCategoryId(material.categoryId) ?? next[existingIndex].categoryId,
        materialTypeId: material._id,
        materialSearchTerm: material.name,
        quantity: String(safeCurrentQuantity + normalizedQuantity),
      };
      continue;
    }

    const firstEmptyIndex = next.findIndex((row) => isFormDraftItemEmpty(row));
    if (firstEmptyIndex >= 0) {
      next[firstEmptyIndex] = {
        ...next[firstEmptyIndex],
        categoryId: extractCategoryId(material.categoryId) ?? "",
        materialTypeId: material._id,
        materialSearchTerm: material.name,
        quantity: String(normalizedQuantity),
      };
      continue;
    }

    next.push({
      localId: crypto.randomUUID(),
      categoryId: extractCategoryId(material.categoryId) ?? "",
      materialTypeId: material._id,
      materialSearchTerm: material.name,
      quantity: String(normalizedQuantity),
    });
  }

  return next;
}

export function applySelectedMaterialToDraftRows(
  currentItems: FormDraftItem[],
  sourceLocalId: string,
  selectedMaterial: MaterialType,
): FormDraftItem[] {
  const sourceRow = currentItems.find((item) => item.localId === sourceLocalId);
  if (!sourceRow) return currentItems;

  const sourceQuantity = Number(sourceRow.quantity);
  const normalizedSourceQuantity =
    Number.isFinite(sourceQuantity) && sourceQuantity > 0 ? sourceQuantity : 1;

  const duplicateIndex = currentItems.findIndex(
    (item) => item.localId !== sourceLocalId && item.materialTypeId === selectedMaterial._id,
  );

  if (duplicateIndex >= 0) {
    return currentItems.map((item, index) => {
      if (index === duplicateIndex) {
        const existingQuantity = Number(item.quantity);
        const normalizedExistingQuantity =
          Number.isFinite(existingQuantity) && existingQuantity > 0 ? existingQuantity : 1;
        return {
          ...item,
          categoryId: extractCategoryId(selectedMaterial.categoryId) ?? item.categoryId,
          materialSearchTerm: selectedMaterial.name,
          quantity: String(normalizedExistingQuantity + normalizedSourceQuantity),
        };
      }

      if (item.localId === sourceLocalId) {
        return {
          ...item,
          categoryId: extractCategoryId(selectedMaterial.categoryId) ?? item.categoryId,
          materialTypeId: "",
          materialSearchTerm: "",
          quantity: "1",
        };
      }

      return item;
    });
  }

  return currentItems.map((item) => {
    if (item.localId !== sourceLocalId) return item;
    return {
      ...item,
      categoryId: extractCategoryId(selectedMaterial.categoryId) ?? item.categoryId,
      materialTypeId: selectedMaterial._id,
      materialSearchTerm: selectedMaterial.name,
    };
  });
}
