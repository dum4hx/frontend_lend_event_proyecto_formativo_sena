import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function ContactPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "ContactPage",
  });

  const planCountLabel = data
    ? t("publicSite.contact.planCount", { count: String(data.planCount) })
    : t("publicSite.contact.updatedPlans");

  return (
    <FooterPageLayout
      title={t("publicSite.contact.title")}
      subtitle={t("publicSite.contact.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.contact.loading")}</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="card space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.contact.salesTitle")}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t("publicSite.contact.salesDescription")}
          </p>
          <p className="text-sm text-gray-400">{t("publicSite.contact.planCountSuffix", { planCountLabel })}</p>
          <p className="text-sm text-gray-400">Email: sales@lendevent.com</p>
          <p className="text-sm text-gray-400">Phone: +57 601 000 1000</p>
        </article>

        <article className="card space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">{t("publicSite.contact.supportTitle")}</h2>
          <p className="text-gray-300 leading-relaxed">
            {t("publicSite.contact.supportDescription")}
          </p>
          <p className="text-sm text-gray-400">{t("publicSite.contact.supportNote")}</p>
          <p className="text-sm text-gray-400">Email: support@lendevent.com</p>
          <p className="text-sm text-gray-400">{t("publicSite.contact.supportHours")}</p>
        </article>
      </div>
    </FooterPageLayout>
  );
}
