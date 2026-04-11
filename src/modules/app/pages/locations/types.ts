/**
 * Local types for the Locations module
 */

// ─── Colombia API Types ───────────────────────────────────────
export interface ColombiaDepartment {
  id: number;
  name: string;
}

export interface ColombiaCity {
  id: number;
  name: string;
  departmentId: number;
  postalCode: string | null;
}

// ─── Location Status ──────────────────────────────────────────
export type LocationStatus = "available" | "full_capacity" | "maintenance" | "inactive";

// ─── Street Types ─────────────────────────────────────────────
export const STREET_TYPES = [
  "Calle",
  "Carrera",
  "Avenida",
  "Avenida Calle",
  "Avenida Carrera",
  "Diagonal",
  "Transversal",
  "Circular",
  "Via",
] as const;

export type StreetType = (typeof STREET_TYPES)[number];

// ─── Form Interfaces ──────────────────────────────────────────
export interface MaterialCapacityRow {
  materialTypeId: string;
  maxQuantity: number | "";
}

export interface LocationFormAddress {
  state: string;
  city: string;
  streetType: string;
  primaryNumber: string;
  secondaryNumber: string;
  complementaryNumber: string;
  additionalInfo: string;
}

export interface LocationFormData {
  code: string;
  name: string;
  managerId: string;
  status: LocationStatus;
  address: LocationFormAddress;
  materialCapacities: MaterialCapacityRow[];
}

// ─── Validation ───────────────────────────────────────────────
export type LocationFieldErrors = Record<string, string | undefined>;

// ─── Filter Options ───────────────────────────────────────────
export interface LocationFilterOptions {
  search: string;
  status: string;
}

// ─── Status Select Options ────────────────────────────────────
export const STATUS_OPTIONS: { value: LocationStatus; labelEn: string; labelEs: string }[] = [
  { value: "available", labelEn: "Available", labelEs: "Disponible" },
  { value: "full_capacity", labelEn: "Full Capacity", labelEs: "Capacidad llena" },
  { value: "maintenance", labelEn: "Maintenance", labelEs: "Mantenimiento" },
  { value: "inactive", labelEn: "Inactive", labelEs: "Inactivo" },
];

// ─── Initial Form State ───────────────────────────────────────
export const INITIAL_FORM: LocationFormData = {
  code: "",
  name: "",
  managerId: "",
  status: "available",
  address: {
    state: "",
    city: "",
    streetType: "",
    primaryNumber: "",
    secondaryNumber: "",
    complementaryNumber: "",
    additionalInfo: "",
  },
  materialCapacities: [],
};

// ─── Status Color Map ─────────────────────────────────────────
export const LOCATION_STATUS_COLORS: Record<string, string> = {
  available: "green",
  full_capacity: "red",
  maintenance: "yellow",
  inactive: "gray",
};
