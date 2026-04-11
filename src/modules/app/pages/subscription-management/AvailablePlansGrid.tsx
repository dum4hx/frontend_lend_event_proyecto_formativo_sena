import { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import type { AvailablePlan, PlanCostResult } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";

interface AvailablePlansGridProps {
  /** List of available plans to display. */
  plans: AvailablePlan[];
  /** The name of the currently active plan (if any). */
  currentPlan: string | undefined;
  /** Whether the current language is Spanish. */
  isEs: boolean;
  /** Locale string for number formatting. */
  locale: string;
  /** Called when the user selects a plan. */
  onChangePlan: (planName: string) => void;
  /** Current seat count for cost estimation. */
  currentSeats?: number;
  /** Callback to calculate cost for a plan given seat count. */
  onCalculateCost?: (plan: string, seatCount: number) => Promise<PlanCostResult>;
  /** Whether the organization has an active subscription (change-plan vs checkout). */
  hasActiveSubscription?: boolean;
  /** Plan name of a pending downgrade (if any). */
  pendingPlan?: string;
}

interface CostState {
  loading: boolean;
  error: boolean;
  data: PlanCostResult | null;
}

export default function AvailablePlansGrid({
  plans,
  currentPlan,
  isEs: _isEs,
  locale,
  onChangePlan,
  currentSeats,
  onCalculateCost,
  hasActiveSubscription,
  pendingPlan,
}: AvailablePlansGridProps) {
  const { t } = useLanguage();
  const [costs, setCosts] = useState<Record<string, CostState>>({});

  useEffect(() => {
    if (!onCalculateCost || !currentSeats || currentSeats < 1) return;

    const dynamicPlans = plans.filter((p) => p.billingModel === "dynamic" && p.pricePerSeat > 0);
    if (dynamicPlans.length === 0) return;

    let active = true;

    const run = async () => {
      const initial: Record<string, CostState> = {};
      for (const p of dynamicPlans) {
        initial[p.name] = { loading: true, error: false, data: null };
      }
      if (!active) return;
      setCosts(initial);

      await Promise.allSettled(
        dynamicPlans.map(async (p) => {
          try {
            const result = await onCalculateCost(p.name, currentSeats);
            if (active) {
              setCosts((prev) => ({
                ...prev,
                [p.name]: { loading: false, error: false, data: result },
              }));
            }
          } catch {
            if (active) {
              setCosts((prev) => ({
                ...prev,
                [p.name]: { loading: false, error: true, data: null },
              }));
            }
          }
        }),
      );
    };

    void run();

    return () => {
      active = false;
    };
  }, [onCalculateCost, currentSeats, plans]);

  if (plans.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        {t("subscription.plans.noPlansFound")}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const planKey = p.name;
          const targetPlanName = p.name;
          const isActive =
            currentPlan &&
            (targetPlanName === currentPlan ||
              targetPlanName.toLowerCase() === currentPlan.toLowerCase() ||
              p.displayName.toLowerCase() === currentPlan.toLowerCase());
          const isPending =
            pendingPlan &&
            (targetPlanName === pendingPlan ||
              targetPlanName.toLowerCase() === pendingPlan.toLowerCase());
          return (
            <div
              key={planKey}
              className={`rounded-xl border ${isActive ? "border-yellow-500" : isPending ? "border-amber-500/50" : "border-[#333]"} bg-[#0f0f0f] p-5 flex flex-col`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold text-lg">{p.displayName}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {p.billingModel === "fixed"
                      ? t("subscription.plans.fixedMonthly")
                      : t("subscription.plans.perSeat")}
                  </div>
                </div>
                {isActive && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-700/30 text-yellow-400 border border-yellow-700">
                    {t("subscription.plans.active")}
                  </span>
                )}
                {!isActive && isPending && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-700/30 text-amber-400 border border-amber-700">
                    {t("subscription.plans.pendingDowngrade")}
                  </span>
                )}
              </div>
              <div className="text-white text-2xl font-bold mb-2">
                ${p.basePriceMonthly.toLocaleString()}
              </div>
              {p.pricePerSeat > 0 && (
                <div className="text-gray-400 text-sm mb-2">
                  + ${p.pricePerSeat.toLocaleString(locale)} {t("subscription.plans.perSeatLabel")}
                </div>
              )}
              <div className="text-gray-400 text-sm mb-3">
                {t("subscription.plans.limits")}:{" "}
                {p.maxSeats < 0
                  ? t("subscription.plans.unlimited")
                  : `${p.maxSeats} ${t("subscription.plans.seats")}`}{" "}
                ·{" "}
                {p.maxCatalogItems < 0
                  ? t("subscription.plans.unlimited")
                  : `${p.maxCatalogItems} items`}
              </div>
              <ul className="text-gray-300 text-sm space-y-1 mb-4">
                {p.features.slice(0, 6).map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-yellow-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Cost breakdown for dynamic plans */}
              {costs[planKey] && (
                <div
                  data-help-id="plan-cost-preview"
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 mb-4"
                >
                  <div className="text-xs text-gray-400 font-medium mb-2">
                    {t("subscription.plans.estimatedCost")}
                  </div>
                  {costs[planKey].loading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Loader2 size={12} className="animate-spin" />
                      {t("subscription.plans.loadingCost")}
                    </div>
                  ) : costs[planKey].error ? (
                    <div className="text-red-400 text-xs">{t("subscription.plans.costError")}</div>
                  ) : costs[planKey].data ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>{t("subscription.plans.baseCost")}</span>
                        <span>
                          $
                          {(costs[planKey].data.baseCost / 100).toLocaleString(locale, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>
                          {t("subscription.plans.seatCost", {
                            count: costs[planKey].data.seatCount,
                          })}
                        </span>
                        <span>
                          $
                          {(costs[planKey].data.seatCost / 100).toLocaleString(locale, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="border-t border-[#333] pt-1 flex justify-between text-yellow-400 font-semibold">
                        <span>{t("subscription.plans.totalCost")}</span>
                        <span>
                          $
                          {(costs[planKey].data.totalCost / 100).toLocaleString(locale, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              <button
                onClick={() => void onChangePlan(targetPlanName)}
                disabled={Boolean(isActive)}
                className={`mt-auto px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "border border-[#333] text-gray-500 cursor-not-allowed"
                    : "gold-action-btn"
                }`}
              >
                {isActive
                  ? t("subscription.plans.currentPlan")
                  : hasActiveSubscription
                    ? t("subscription.plans.changePlan")
                    : t("subscription.plans.choosePlan")}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {t("subscription.plans.planChangeNote")}
      </p>
    </>
  );
}
