import { Link } from "react-router-dom";
import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PricingPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "PricingPage",
  });

  return (
    <FooterPageLayout
      title="Pricing"
      subtitle="Choose the plan that best fits your operation and unlock tools to improve fulfillment speed and visibility."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading plans...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.plans.map((plan, index) => (
            <article
              key={plan.plan}
              className={`card space-y-4 ${index === 1 ? "border-yellow-400/40" : ""}`}
            >
              <h2 className="text-lg font-bold">{plan.displayName}</h2>
              <p className="text-3xl font-extrabold text-yellow-400">
                ${formatAmount(plan.basePriceMonthly)}
              </p>
              <p className="text-sm text-gray-400">
                {plan.description ?? "Flexible pricing for growing operations."}
              </p>
            </article>
          ))}
        </div>
      )}

      <div>
        <Link
          to="/packages"
          className="inline-flex mt-2 bg-[rgba(255,215,0,0.1)] text-[#FFD700] font-semibold px-4 py-2 rounded-lg border border-[rgba(255,215,0,0.35)] hover:bg-[rgba(255,215,0,0.18)] hover:border-[rgba(255,215,0,0.55)] transition-colors"
        >
          Explore Full Plans
        </Link>
      </div>
    </FooterPageLayout>
  );
}
