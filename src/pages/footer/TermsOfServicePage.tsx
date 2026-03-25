import FooterPageLayout from "./FooterPageLayout";
import { useLanguage } from "../../contexts/useLanguage";

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  const sections = [
    {
      title: t("publicSite.terms.section.serviceScope.title"),
      content: t("publicSite.terms.section.serviceScope.content"),
    },
    {
      title: t("publicSite.terms.section.accountResponsibilities.title"),
      content: t("publicSite.terms.section.accountResponsibilities.content"),
    },
    {
      title: t("publicSite.terms.section.subscriptionPayments.title"),
      content: t("publicSite.terms.section.subscriptionPayments.content"),
    },
    {
      title: t("publicSite.terms.section.acceptableUse.title"),
      content: t("publicSite.terms.section.acceptableUse.content"),
    },
    {
      title: t("publicSite.terms.section.dataAvailability.title"),
      content: t("publicSite.terms.section.dataAvailability.content"),
    },
    {
      title: t("publicSite.terms.section.termination.title"),
      content: t("publicSite.terms.section.termination.content"),
    },
  ];

  return (
    <FooterPageLayout
      title={t("publicSite.terms.title")}
      subtitle={t("publicSite.terms.subtitle")}
    >
      <section className="card space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
              {t("publicSite.terms.legalNotice")}
            </p>
            <h2 className="text-xl font-bold text-white">{t("publicSite.terms.platformTerms")}</h2>
          </div>
          <p className="text-sm text-gray-400">{t("publicSite.terms.lastUpdated")}</p>
        </div>
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.terms.intro")}
        </p>
      </section>

      <div className="space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="card space-y-3">
            <h2 className="text-xl font-bold text-yellow-400">{section.title}</h2>
            <p className="text-gray-300 leading-relaxed">{section.content}</p>
          </article>
        ))}
      </div>

      <section className="card space-y-3">
        <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.terms.contactTitle")}</h2>
        <p className="text-gray-300 leading-relaxed">
          {t("publicSite.terms.contactDescription")}
        </p>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Email: legal@lendevent.com</p>
          <p>Compliance: compliance@lendevent.com</p>
          <p>{t("publicSite.terms.responseWindow")}</p>
        </div>
      </section>
    </FooterPageLayout>
  );
}
