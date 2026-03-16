import { getSubscriptionTypesPublic } from "./subscriptionTypeService";
import type { PublicPlan } from "../types/api";

export interface FooterContentSummary {
  plans: PublicPlan[];
  planCount: number;
  startingPrice: number | null;
  averageBasePrice: number | null;
  highlightedFeatures: string[];
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getFooterContentSummary(): Promise<FooterContentSummary> {
  const response = await getSubscriptionTypesPublic();
  const plans = response.data.subscriptionTypes;
  const positivePrices = plans
    .map((plan) => plan.basePriceMonthly)
    .filter((price) => Number.isFinite(price) && price > 0);

  const startingPrice = positivePrices.length > 0 ? Math.min(...positivePrices) : null;
  const averageBasePrice =
    positivePrices.length > 0
      ? roundToTwo(positivePrices.reduce((sum, price) => sum + price, 0) / positivePrices.length)
      : null;

  const highlightedFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features).filter((feature) => feature.trim().length > 0)),
  ).slice(0, 6);

  return {
    plans,
    planCount: plans.length,
    startingPrice,
    averageBasePrice,
    highlightedFeatures,
  };
}
