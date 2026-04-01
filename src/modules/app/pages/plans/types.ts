import type { PackageMaterialEntry } from "../../../../types/api";

/** Form data for creating a new package / plan. */
export interface PackageFormData {
  name: string;
  description: string;
  pricePerDay: string;
  entries: PackageMaterialEntry[];
}

export const DEFAULT_FORM: PackageFormData = {
  name: "",
  description: "",
  pricePerDay: "",
  entries: [{ materialTypeId: "", quantity: 1 }],
};
