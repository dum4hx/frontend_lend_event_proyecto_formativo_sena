import type { PaymentMethod } from "../../../../types/api";

/** Internal form state for create/edit payment method modal. */
export interface MethodForm {
  name: string;
  description: string;
  status: "active" | "inactive";
}

export const EMPTY_FORM: MethodForm = { name: "", description: "", status: "active" };

export function methodToForm(method: PaymentMethod): MethodForm {
  return {
    name: method.name,
    description: method.description ?? "",
    status: method.status,
  };
}
