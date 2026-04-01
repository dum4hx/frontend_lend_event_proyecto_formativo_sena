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

      {/* Values Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t("publicSite.aboutPage.valuesTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-yellow-400/20 transition-all">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">{t("publicSite.aboutPage.value1Title")}</h3>
            <p className="text-gray-400 text-sm">{t("publicSite.aboutPage.value1Description")}</p>
          </div>
          <div className="p-6 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-yellow-400/20 transition-all">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">{t("publicSite.aboutPage.value2Title")}</h3>
            <p className="text-gray-400 text-sm">{t("publicSite.aboutPage.value2Description")}</p>
          </div>
          <div className="p-6 bg-[#1a1a1a] border border-[#333] rounded-xl hover:border-yellow-400/20 transition-all">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">{t("publicSite.aboutPage.value3Title")}</h3>
            <p className="text-gray-400 text-sm">{t("publicSite.aboutPage.value3Description")}</p>
          </div>
        </div>
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
