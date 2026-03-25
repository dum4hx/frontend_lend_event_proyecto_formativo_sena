import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function WhatsNewPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "WhatsNewPage",
  });

  const updates = (data?.highlightedFeatures ?? []).map(
    (feature) => t("publicSite.whatsNew.update", { feature: feature.toLowerCase() }),
  );

  return (
    <FooterPageLayout
      title={t("publicSite.whatsNew.title")}
      subtitle={t("publicSite.whatsNew.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.whatsNew.loading")}</p>}
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
            <p className="text-gray-300">{t("publicSite.whatsNew.empty")}</p>
          </li>
        )}
      </ul>
    </FooterPageLayout>
  );
}
