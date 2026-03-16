import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function HelpCenterPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "HelpCenterPage",
  });

  return (
    <FooterPageLayout
      title="Help Center"
      subtitle="Access onboarding guidance, troubleshooting resources, and implementation best practices."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading help resources...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">Getting Started</h2>
          <p className="text-gray-300">Set up your organization, invite team members, and configure operational roles.</p>
          {data && data.highlightedFeatures[0] && (
            <p className="text-sm text-gray-400">Recommended first module: {data.highlightedFeatures[0]}</p>
          )}
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">Knowledge Base</h2>
          <p className="text-gray-300">Find clear solutions for billing, inventory, contracts, and reporting workflows.</p>
          {data && data.highlightedFeatures[1] && (
            <p className="text-sm text-gray-400">Trending topic: {data.highlightedFeatures[1]}</p>
          )}
        </article>
      </div>
    </FooterPageLayout>
  );
}
