import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function WhatsNewPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "WhatsNewPage",
  });

  const updates = (data?.highlightedFeatures ?? []).map(
    (feature) => `New update: expanded support for ${feature.toLowerCase()}.`,
  );

  return (
    <FooterPageLayout
      title="What's New"
      subtitle="Stay up to date with the latest platform enhancements and product releases."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading product updates...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <ul className="space-y-3">
        {updates.map((update) => (
          <li key={update} className="card flex items-start gap-3">
            <span className="mt-2 w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
            <p className="text-gray-300">{update}</p>
          </li>
        ))}
        {!isLoading && updates.length === 0 && (
          <li className="card">
            <p className="text-gray-300">No published updates yet.</p>
          </li>
        )}
      </ul>
    </FooterPageLayout>
  );
}
