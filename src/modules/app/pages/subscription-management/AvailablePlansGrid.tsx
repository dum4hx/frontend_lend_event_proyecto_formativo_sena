import { CheckCircle } from "lucide-react";
import type { AvailablePlan } from "../../../../types/api";

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
}

export default function AvailablePlansGrid({
  plans,
  currentPlan,
  isEs,
  locale,
  onChangePlan,
}: AvailablePlansGridProps) {
  if (plans.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        {isEs
          ? "No se encontraron planes disponibles. Contacta soporte o intenta de nuevo mas tarde."
          : "No available plans found. Please contact support or try again later."}
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
              p.displayName.toLowerCase() === currentPlan?.toLowerCase());
          return (
            <div
              key={planKey}
              className={`rounded-xl border ${isActive ? "border-yellow-500" : "border-[#333]"} bg-[#0f0f0f] p-5 flex flex-col`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold text-lg">
                    {p.displayName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {p.billingModel === "fixed"
                      ? isEs
                        ? "Fijo mensual"
                        : "Fixed monthly"
                      : isEs
                        ? "Por asiento"
                        : "Per-seat"}
                  </div>
                </div>
                {isActive && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-700/30 text-yellow-400 border border-yellow-700">
                    {isEs ? "Activo" : "Active"}
                  </span>
                )}
              </div>
              <div className="text-white text-2xl font-bold mb-2">
                ${p.basePriceMonthly.toLocaleString()}
              </div>
              {p.pricePerSeat > 0 && (
                <div className="text-gray-400 text-sm mb-2">
                  + ${p.pricePerSeat.toLocaleString(locale)}{" "}
                  {isEs ? "por asiento" : "per seat"}
                </div>
              )}
              <div className="text-gray-400 text-sm mb-3">
                {isEs ? "Limites" : "Limits"}:{" "}
                {p.maxSeats < 0
                  ? isEs
                    ? "Ilimitado"
                    : "Unlimited"
                  : `${p.maxSeats} ${isEs ? "asientos" : "seats"}`}{" "}
                ·{" "}
                {p.maxCatalogItems < 0
                  ? isEs
                    ? "Ilimitado"
                    : "Unlimited"
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
                  ? isEs
                    ? "Plan actual"
                    : "Current Plan"
                  : currentPlan
                    ? p.basePriceMonthly > 0
                      ? isEs
                        ? "Mejorar / Cambiar"
                        : "Upgrade / Change"
                      : isEs
                        ? "Cambiar plan"
                        : "Change Plan"
                    : isEs
                      ? "Elegir plan"
                      : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        {isEs
          ? "Los cambios de plan usan la pasarela de pago existente y requieren autenticacion valida."
          : "Plan changes use the existing payment gateway and require valid authentication."}
      </p>
    </>
  );
}
