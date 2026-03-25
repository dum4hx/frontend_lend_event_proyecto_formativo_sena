import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function BusinessPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "BusinessPage",
  });

  return (
    <FooterPageLayout
      title={t("publicSite.business.title")}
      subtitle={t("publicSite.business.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.business.loading")}</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="card space-y-3">
          <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.business.multiLocationTitle")}</h2>
          <p className="text-gray-300">{t("publicSite.business.multiLocationDescription")}</p>
          {data && <p className="text-sm text-gray-400">{t("publicSite.business.scaleTiers", { count: String(data.planCount) })}</p>}
        </article>
        <article className="card space-y-3">
          <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.business.permissionsTitle")}</h2>
          <p className="text-gray-300">{t("publicSite.business.permissionsDescription")}</p>
          {data && data.highlightedFeatures[0] && (
            <p className="text-sm text-gray-400">{t("publicSite.business.popularFeature", { feature: data.highlightedFeatures[0] })}</p>
          )}
        </article>
      </div>
    </FooterPageLayout>
  );
}
