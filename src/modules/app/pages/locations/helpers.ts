/**
 * Pure helper functions for the Locations module
 */

import type {
  WarehouseLocation,
  LocationAddress,
} from "../../../../services/warehouseOperatorService";
import type { MaterialType, MaterialCategory } from "../../../../types/api";
import type { MaterialCapacityRow } from "./types";

/**
 * Format a LocationAddress into a human-readable string.
 * Example: "Calle 10 #45-67"
 */
export function formatAddress(address: LocationAddress | undefined): string {
  if (!address) return "N/A";
  const { streetType, primaryNumber, secondaryNumber, complementaryNumber } = address;
  if (!streetType || !primaryNumber) return "N/A";
  let formatted = `${streetType} ${primaryNumber}`;
  if (secondaryNumber) formatted += ` #${secondaryNumber}`;
  if (complementaryNumber) formatted += `-${complementaryNumber}`;
  return formatted;
}

/**
 * Format full location string: "Calle 10 #45-67, Bogotá, Cundinamarca"
 */
export function formatFullAddress(address: LocationAddress | undefined): string {
  if (!address) return "N/A";
  const street = formatAddress(address);
  const parts = [street];
  if (address.city) parts.push(address.city);
  if (address.department) parts.push(address.department);
  return parts.join(", ");
}

/**
 * Calculate total capacity of a location by summing all material type limits
 */
export function calculateLocationCapacity(location: WarehouseLocation): number {
  if (!location.materialCapacities || location.materialCapacities.length === 0) {
    return location.capacity ?? 0;
  }
  return location.materialCapacities.reduce((sum, cap) => sum + (cap.maxQuantity || 0), 0);
}

/**
 * Get occupied count from materialCapacities
 */
export function calculateOccupied(location: WarehouseLocation): number {
  const caps = location.materialCapacities as
    | Array<{ currentQuantity?: number; occupiedQuantity?: number; current?: number }>
    | undefined;

  if (!caps || caps.length === 0) return location.occupied ?? 0;

  const hasPerTypeOccupied = caps.some(
    (cap) =>
      typeof cap.currentQuantity === "number" ||
      typeof cap.occupiedQuantity === "number" ||
      typeof cap.current === "number",
  );

  if (!hasPerTypeOccupied) return location.occupied ?? 0;

  return caps.reduce((sum, cap) => {
    const value = cap.currentQuantity ?? cap.occupiedQuantity ?? cap.current ?? 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/**
 * Calculate utilization percentage
 */
export function calculateUtilization(locations: WarehouseLocation[]): number {
  if (locations.length === 0) return 0;
  const totalOccupied = locations.reduce((s, l) => s + calculateOccupied(l), 0);
  const totalCapacity = locations.reduce((s, l) => s + calculateLocationCapacity(l), 0);
  if (totalCapacity === 0) return 0;
  return Math.round((totalOccupied / totalCapacity) * 100);
}

/**
 * Normalize text: remove accents/tildes for accent-insensitive matching
 */
export function normalize(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Resolve categoryId which can be string, object, or array into a display name
 */
export function resolveCategoryName(categoryId: unknown, categories: MaterialCategory[]): string {
  if (typeof categoryId === "string") {
    return categories.find((c) => c._id === categoryId)?.name || "General";
  }
  if (Array.isArray(categoryId) && categoryId.length > 0) {
    return (categoryId[0] as { name?: string })?.name || "General";
  }
  if (categoryId && typeof categoryId === "object") {
    return (categoryId as { name?: string })?.name || "General";
  }
  return "General";
}

/**
 * Resolve categoryId to its raw _id string
 */
export function resolveCategoryId(categoryId: unknown): string {
  if (typeof categoryId === "string") return categoryId;
  if (Array.isArray(categoryId) && categoryId.length > 0) {
    return (categoryId[0] as { _id?: string })?._id || "";
  }
  if (categoryId && typeof categoryId === "object") {
    return (categoryId as { _id?: string })?._id || "";
  }
  return "";
}

/**
 * Build export rows for XLSX/CSV export
 */
export function buildExportRows(locs: WarehouseLocation[]): Record<string, string>[] {
  return locs.map((loc) => {
    const address = loc.address || ({} as LocationAddress);
    const manager =
      loc.manager ?? (loc.managerId && typeof loc.managerId === "object" ? loc.managerId : null);
    const managerName = manager
      ? [
          manager.name.firstName,
          manager.name.secondName,
          manager.name.firstSurname,
          manager.name.secondSurname,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    return {
      Code: loc.code || "",
      Name: loc.name || "",
      "Manager Name": managerName,
      "Manager Email": manager?.email || "",
      Status: loc.isActive ? "active" : "inactive",
      "Street Type": address.streetType || "",
      "Primary Number": address.primaryNumber || "",
      "Secondary Number": address.secondaryNumber || "",
      "Complementary Number": address.complementaryNumber || "",
      Department: address.department || "",
      City: address.city || "",
      "Additional Details": address.additionalDetails || "",
    };
  });
}

/**
 * Build material capacities array from material types, pre-filling from existing location data
 */
export function buildCapacitiesFromTypes(
  materialTypes: MaterialType[],
  existingCapacities?: { materialTypeId: string; maxQuantity: number }[],
): MaterialCapacityRow[] {
  return materialTypes.map((t) => {
    const existing = existingCapacities?.find((c) => c.materialTypeId === t._id);
    return {
      materialTypeId: t._id,
      maxQuantity: existing ? existing.maxQuantity : "",
    };
  });
}

/**
 * Apply bulk capacity to all or a subset of material capacities
 */
export function applyBulkCapacityToRows(
  rows: MaterialCapacityRow[],
  value: number,
  materialTypes: MaterialType[],
  categoryId?: string,
  fillEmptyOnly?: boolean,
): MaterialCapacityRow[] {
  return rows.map((c) => {
    const isTarget =
      !categoryId ||
      resolveCategoryId(materialTypes.find((t) => t._id === c.materialTypeId)?.categoryId) ===
        categoryId;
    if (!isTarget) return c;
    if (fillEmptyOnly && c.maxQuantity !== "") return c;
    return { ...c, maxQuantity: value };
  });
}

/**
 * Parse legacy street format "Calle 10 #45-30" into components
 */
export function parseLegacyStreet(street: string): {
  streetType: string;
  primaryNumber: string;
  secondaryNumber: string;
  complementaryNumber: string;
} {
  const match = street.match(/^(.+?)\s+(\S+)\s*#\s*(\S+)(?:-(\S+))?/);
  if (match) {
    return {
      streetType: match[1].trim(),
      primaryNumber: match[2],
      secondaryNumber: match[3],
      complementaryNumber: match[4] || "",
    };
  }
  return {
    streetType: "",
    primaryNumber: street,
    secondaryNumber: "",
    complementaryNumber: "",
  };
}

/**
 * Parse a CSV line respecting quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Filter locations by search term (name, street, city)
 */
export function filterLocations(
  locations: WarehouseLocation[],
  searchTerm: string,
  statusFilter?: string,
): WarehouseLocation[] {
  return locations.filter((loc) => {
    // Status filter
    if (statusFilter && loc.status !== statusFilter) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (loc.name ?? "").toLowerCase();
      const address = loc.address || ({} as LocationAddress);
      const streetInfo = `${address.streetType ?? ""} ${address.primaryNumber ?? ""}`
        .trim()
        .toLowerCase();
      const city = (address.city ?? "").toLowerCase();
      if (!name.includes(term) && !streetInfo.includes(term) && !city.includes(term)) return false;
    }

    return true;
  });
}

/**
 * Filter material types by search and category
 */
export function filterMaterialTypes(
  types: MaterialType[],
  categories: MaterialCategory[],
  searchTerm: string,
  selectedCategoryId: string,
): MaterialType[] {
  return types.filter((mt) => {
    const catId = resolveCategoryId(mt.categoryId);
    if (selectedCategoryId && catId !== selectedCategoryId) return false;
    if (searchTerm) {
      const matchesName = mt.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesName) {
        const categoryName = resolveCategoryName(mt.categoryId, categories);
        return categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    return true;
  });
}
