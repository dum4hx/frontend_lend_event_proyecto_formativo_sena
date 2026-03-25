import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getBillingHistory } from "../../services/billingService";
import { useLanguage } from "../../contexts/useLanguage";

function formatCurrency(value: number, locale: string): string {
  return value.toLocaleString(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BillingPage() {
  const { t, language } = useLanguage();
  const moneyLocale = language === "es" ? "es-CO" : "en-US";

  const { data, isLoading, error } = useApiQuery(
    async () => {
      const response = await getBillingHistory(5);
      return response.data.history;
    },
    { context: "BillingPage" },
  );

  return (
    <FooterPageLayout
      title={t("publicSite.billing.title")}
      subtitle={t("publicSite.billing.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.billing.loading")}</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error.statusCode === 401
            ? t("publicSite.billing.authRequired")
            : error.message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.billing.paymentMethodsTitle")}</h2>
          <p className="text-sm text-gray-300">{t("publicSite.billing.paymentMethodsDescription")}</p>
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.billing.historyTitle")}</h2>
          <p className="text-sm text-gray-300">{t("publicSite.billing.historyDescription")}</p>
          {data && data.length > 0 && (
            <ul className="space-y-2 text-xs text-gray-400">
              {data.slice(0, 3).map((entry) => (
                <li key={entry._id} className="flex items-center justify-between border-b border-zinc-800 pb-1">
                  <span className="capitalize">{entry.eventType.replace(/_/g, " ")}</span>
                  <span>{formatCurrency(entry.amount ?? 0, moneyLocale)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">{t("publicSite.billing.taxTitle")}</h2>
          <p className="text-sm text-gray-300">{t("publicSite.billing.taxDescription")}</p>
        </article>
      </div>
    </FooterPageLayout>
  );
}
