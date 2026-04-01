import type {
  PricingConfig,
  PricingScope,
  FormState,
  PerDayParams,
  WeeklyMonthlyParams,
  FixedParams,
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
} from "./types";
import { SCOPE_LABELS, STRATEGY_LABELS } from "./types";

export { SCOPE_LABELS, STRATEGY_LABELS };

// ─── Config ↔ Form conversion ─────────────────────────────────────────────

export function configToForm(config: PricingConfig): FormState {
  return {
    scope: config.scope,
    referenceId: config.referenceId,
    strategyType: config.strategyType,
    overridePricePerDay:
      config.perDayParams?.overridePricePerDay != null
        ? String(config.perDayParams.overridePricePerDay)
        : "",
    weeklyPrice: config.weeklyMonthlyParams ? String(config.weeklyMonthlyParams.weeklyPrice) : "",
    weeklyThreshold: config.weeklyMonthlyParams
      ? String(config.weeklyMonthlyParams.weeklyThreshold)
      : "",
    monthlyPrice: config.weeklyMonthlyParams ? String(config.weeklyMonthlyParams.monthlyPrice) : "",
    monthlyThreshold: config.weeklyMonthlyParams
      ? String(config.weeklyMonthlyParams.monthlyThreshold)
      : "",
    flatPrice: config.fixedParams ? String(config.fixedParams.flatPrice) : "",
  };
}

export function buildPayload(form: FormState): CreatePricingConfigPayload | UpdatePricingConfigPayload {
  const base = {
    strategyType: form.strategyType,
  };

  let perDayParams: PerDayParams | undefined;
  let weeklyMonthlyParams: WeeklyMonthlyParams | undefined;
  let fixedParams: FixedParams | undefined;

  if (form.strategyType === "per_day") {
    perDayParams = {
      overridePricePerDay:
        form.overridePricePerDay !== "" ? Number(form.overridePricePerDay) : null,
    };
  } else if (form.strategyType === "weekly_monthly") {
    weeklyMonthlyParams = {
      weeklyPrice: Number(form.weeklyPrice),
      weeklyThreshold: Number(form.weeklyThreshold),
      monthlyPrice: Number(form.monthlyPrice),
      monthlyThreshold: Number(form.monthlyThreshold),
    };
  } else if (form.strategyType === "fixed") {
    fixedParams = {
      flatPrice: Number(form.flatPrice),
    };
  }

  return {
    ...base,
    ...(perDayParams !== undefined ? { perDayParams } : {}),
    ...(weeklyMonthlyParams !== undefined ? { weeklyMonthlyParams } : {}),
    ...(fixedParams !== undefined ? { fixedParams } : {}),
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────

export function getScopeBadgeStyle(scope: PricingScope): string {
  switch (scope) {
    case "organization":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "materialType":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    case "package":
      return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

export function formatStrategyParams(config: PricingConfig): string {
  if (config.strategyType === "per_day" && config.perDayParams) {
    const price = config.perDayParams.overridePricePerDay;
    return price != null ? `$${price}/day` : "Default rate";
  }
  if (config.strategyType === "weekly_monthly" && config.weeklyMonthlyParams) {
    const p = config.weeklyMonthlyParams;
    return `$${p.weeklyPrice}/week (≥${p.weeklyThreshold}d), $${p.monthlyPrice}/mo (≥${p.monthlyThreshold}d)`;
  }
  if (config.strategyType === "fixed" && config.fixedParams) {
    return `$${config.fixedParams.flatPrice} flat`;
  }
  return "—";
}
