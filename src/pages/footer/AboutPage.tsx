import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function AboutPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "AboutPage",
  });

  return (
    <FooterPageLayout
      title="About LendEvent"
      subtitle="We build tools that help operations teams run reliable and profitable event rental workflows."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading company metrics...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="card space-y-5">
        <p className="text-gray-300 leading-relaxed">
          LendEvent started with a clear mission: eliminate operational bottlenecks in inventory-heavy event businesses.
          Our product combines rental tracking, workflow automation, and actionable analytics for growing teams.
        </p>
        {data && (
          <p className="text-gray-300 leading-relaxed">
            Our public catalog currently includes {data.planCount} subscription plans and a feature stack focused on
            operational control, traceability, and growth.
          </p>
        )}
        <p className="text-gray-300 leading-relaxed">
          Today, we support organizations across multiple regions with a platform designed for performance, traceability,
          and collaboration between logistics, sales, and finance.
        </p>
      </div>
    </FooterPageLayout>
  );
}
