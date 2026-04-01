import type {
  PricingConfig,
  PricingScope,
  PricingStrategyType,
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
  PerDayParams,
  WeeklyMonthlyParams,
  FixedParams,
  PricingPreviewParams,
  PricingPreviewResult,
  MaterialType,
  Package,
} from "../../../../types/api";

export type {
  PricingConfig,
  PricingScope,
  PricingStrategyType,
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
  PerDayParams,
  WeeklyMonthlyParams,
  FixedParams,
  PricingPreviewParams,
  PricingPreviewResult,
  MaterialType,
  Package,
};

// ─── Constants ────────────────────────────────────────────────────────────

export const SCOPE_LABELS: Record<PricingScope, string> = {
  organization: "Organization (default)",
  materialType: "Material Type",
  package: "Package",
};

export const STRATEGY_LABELS: Record<PricingStrategyType, string> = {
  per_day: "Per Day",
  weekly_monthly: "Weekly / Monthly",
  fixed: "Fixed Price",
};

// ─── Form types ───────────────────────────────────────────────────────────

export interface FormState {
  scope: PricingScope;
  referenceId: string;
  strategyType: PricingStrategyType;
  overridePricePerDay: string;
  weeklyPrice: string;
  weeklyThreshold: string;
  monthlyPrice: string;
  monthlyThreshold: string;
  flatPrice: string;
}

export const EMPTY_FORM: FormState = {
  scope: "organization",
  referenceId: "-",
  strategyType: "per_day",
  overridePricePerDay: "",
  weeklyPrice: "",
  weeklyThreshold: "",
  monthlyPrice: "",
  monthlyThreshold: "",
  flatPrice: "",
};

export interface PreviewFormState {
  itemType: "material" | "package";
  referenceId: string;
  quantity: string;
  durationInDays: string;
}

export const EMPTY_PREVIEW_FORM: PreviewFormState = {
  itemType: "material",
  referenceId: "",
  quantity: "1",
  durationInDays: "1",
};

/** Item reference used in form selects */
export interface FormItem {
  _id: string;
  name: string;
}
