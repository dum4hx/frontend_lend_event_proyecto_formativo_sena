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

      {/* Mission / Problem / Vision cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <article className="card p-6 space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.aboutPage.missionTitle")}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{t("publicSite.aboutPage.missionDescription")}</p>
        </article>
        <article className="card p-6 space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.aboutPage.problemTitle")}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{t("publicSite.aboutPage.problemDescription")}</p>
        </article>
        <article className="card p-6 space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.aboutPage.visionTitle")}</h2>
          <p className="text-gray-300 text-sm leading-relaxed">{t("publicSite.aboutPage.visionDescription")}</p>
        </article>
      </div>

      {/* Detailed content */}
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
