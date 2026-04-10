import type { CodeScheme, CodeSchemeEntityType } from "../../../../types/api";

/** Scope mode for material_instance schemes. */
export type ScopeMode = "global" | "by_type" | "by_category";

/** Internal form state for create/edit code scheme modal. */
export interface SchemeForm {
  name: string;
  pattern: string;
  entityType: CodeSchemeEntityType;
  isActive: boolean;
  isDefault: boolean;
  /** Only for material_instance — scoped to a specific material type. */
  materialTypeId: string | null;
  /** Only for material_instance — scoped to a specific category. */
  categoryId: string | null;
}

export const EMPTY_FORM: SchemeForm = {
  name: "",
  pattern: "",
  entityType: "loan",
  isActive: true,
  isDefault: false,
  materialTypeId: null,
  categoryId: null,
};

export function schemeToForm(scheme: CodeScheme): SchemeForm {
  return {
    name: scheme.name,
    pattern: scheme.pattern,
    entityType: scheme.entityType,
    isActive: scheme.isActive,
    isDefault: scheme.isDefault,
    materialTypeId: scheme.materialTypeId ?? null,
    categoryId: scheme.categoryId ?? null,
  };
}

/** Derive the scope mode from the form state. */
export function getScopeMode(form: SchemeForm): ScopeMode {
  if (form.materialTypeId) return "by_type";
  if (form.categoryId) return "by_category";
  return "global";
}
