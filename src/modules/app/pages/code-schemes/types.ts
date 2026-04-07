import type { CodeScheme, CodeSchemeEntityType } from "../../../../types/api";

/** Internal form state for create/edit code scheme modal. */
export interface SchemeForm {
  name: string;
  pattern: string;
  entityType: CodeSchemeEntityType;
  isActive: boolean;
  isDefault: boolean;
}

export const EMPTY_FORM: SchemeForm = {
  name: "",
  pattern: "",
  entityType: "loan",
  isActive: true,
  isDefault: false,
};

export function schemeToForm(scheme: CodeScheme): SchemeForm {
  return {
    name: scheme.name,
    pattern: scheme.pattern,
    entityType: scheme.entityType,
    isActive: scheme.isActive,
    isDefault: scheme.isDefault,
  };
}
