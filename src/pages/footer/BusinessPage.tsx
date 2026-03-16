import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function BusinessPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "BusinessPage",
  });

  return (
    <FooterPageLayout
      title="Business Solutions"
      subtitle="Scale operations with enterprise-ready features built for multi-branch and high-volume event teams."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading business capabilities...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="card space-y-3">
          <h2 className="text-xl font-bold text-yellow-400">Multi-Location Control</h2>
          <p className="text-gray-300">Coordinate stock availability and transfers between warehouses in real time.</p>
          {data && <p className="text-sm text-gray-400">Built to scale across {data.planCount} deployment tiers.</p>}
        </article>
        <article className="card space-y-3">
          <h2 className="text-xl font-bold text-yellow-400">Team Permissions</h2>
          <p className="text-gray-300">Assign role-based access to protect sensitive workflows and business data.</p>
          {data && data.highlightedFeatures[0] && (
            <p className="text-sm text-gray-400">Popular feature: {data.highlightedFeatures[0]}</p>
          )}
        </article>
      </div>
    </FooterPageLayout>
  );
}
