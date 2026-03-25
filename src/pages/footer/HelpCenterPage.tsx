import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function HelpCenterPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "HelpCenterPage",
  });

  return (
    <FooterPageLayout
      title={t("publicSite.helpCenter.title")}
      subtitle={t("publicSite.helpCenter.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.helpCenter.loading")}</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.helpCenter.gettingStarted")}</h2>
          <p className="text-gray-300">{t("publicSite.helpCenter.gettingStartedDescription")}</p>
          {data && data.highlightedFeatures[0] && (
            <p className="text-sm text-gray-400">{t("publicSite.helpCenter.recommendedModule", { module: data.highlightedFeatures[0] })}</p>
          )}
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.helpCenter.knowledgeBase")}</h2>
          <p className="text-gray-300">{t("publicSite.helpCenter.knowledgeBaseDescription")}</p>
          {data && data.highlightedFeatures[1] && (
            <p className="text-sm text-gray-400">{t("publicSite.helpCenter.trendingTopic", { topic: data.highlightedFeatures[1] })}</p>
          )}
        </article>
      </div>
    </FooterPageLayout>
  );
}
