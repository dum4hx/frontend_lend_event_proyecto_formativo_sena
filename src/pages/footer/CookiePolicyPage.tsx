import FooterPageLayout from "./FooterPageLayout";
import { useLanguage } from "../../contexts/useLanguage";

export default function CookiePolicyPage() {
  const { t } = useLanguage();

  const cookieSections = [
    {
      title: t("publicSite.cookie.section.essential.title"),
      content: t("publicSite.cookie.section.essential.content"),
    },
    {
      title: t("publicSite.cookie.section.functional.title"),
      content: t("publicSite.cookie.section.functional.content"),
    },
    {
      title: t("publicSite.cookie.section.analytics.title"),
      content: t("publicSite.cookie.section.analytics.content"),
    },
    {
      title: t("publicSite.cookie.section.thirdParty.title"),
      content: t("publicSite.cookie.section.thirdParty.content"),
    },
    {
      title: t("publicSite.cookie.section.managing.title"),
      content: t("publicSite.cookie.section.managing.content"),
    },
  ];

  return (
    <FooterPageLayout
      title={t("publicSite.cookie.title")}
      subtitle={t("publicSite.cookie.subtitle")}
    >
      <section className="card space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
              {t("publicSite.cookie.privacyNotice")}
            </p>
            <h2 className="text-xl font-bold text-white">{t("publicSite.cookie.useOfCookies")}</h2>
          </div>
          <p className="text-sm text-gray-400">{t("publicSite.cookie.lastUpdated")}</p>
        </div>
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.cookie.intro")}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cookieSections.map((section) => (
          <article key={section.title} className="card space-y-3">
            <h2 className="text-lg font-bold text-yellow-400">{section.title}</h2>
            <p className="text-gray-300 leading-relaxed">{section.content}</p>
          </article>
        ))}
      </div>

      <section className="card space-y-3">
        <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.cookie.contactTitle")}</h2>
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.cookie.contactDescription")}
        </p>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Email: privacy@lendevent.com</p>
          <p>Legal: legal@lendevent.com</p>
          <p>{t("publicSite.cookie.responseWindow")}</p>
        </div>
      </section>
    </FooterPageLayout>
  );
}
