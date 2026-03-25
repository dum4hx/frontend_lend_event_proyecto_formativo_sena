import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function AboutPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "AboutPage",
  });

  return (
    <FooterPageLayout
      title={t("publicSite.aboutPage.title")}
      subtitle={t("publicSite.aboutPage.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.aboutPage.loading")}</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="card space-y-5">
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.aboutPage.paragraph1")}
        </p>
        {data && (
          <p className="text-gray-300 leading-relaxed">
            {t("publicSite.aboutPage.metrics", {
              planCount: String(data.planCount),
            })}
          </p>
        )}
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.aboutPage.paragraph2")}
        </p>
      </div>
    </FooterPageLayout>
  );
}
