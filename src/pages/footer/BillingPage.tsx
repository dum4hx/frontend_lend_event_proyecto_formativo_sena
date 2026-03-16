import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getBillingHistory } from "../../services/billingService";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BillingPage() {
  const { data, isLoading, error } = useApiQuery(
    async () => {
      const response = await getBillingHistory(5);
      return response.data.history;
    },
    { context: "BillingPage" },
  );

  return (
    <FooterPageLayout
      title="Billing & Invoices"
      subtitle="Manage payment methods, review billing cycles, and keep your accounting team aligned with every transaction."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading billing history...</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error.statusCode === 401
            ? "Sign in to view your organization billing history."
            : error.message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">Payment Methods</h2>
          <p className="text-sm text-gray-300">Add cards, update billing contacts, and define your default payment source.</p>
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">Billing History</h2>
          <p className="text-sm text-gray-300">Track invoices, downloadable receipts, and payment statuses in one place.</p>
          {data && data.length > 0 && (
            <ul className="space-y-2 text-xs text-gray-400">
              {data.slice(0, 3).map((entry) => (
                <li key={entry._id} className="flex items-center justify-between border-b border-zinc-800 pb-1">
                  <span className="capitalize">{entry.eventType.replace(/_/g, " ")}</span>
                  <span>{formatCurrency(entry.amount ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card space-y-3">
          <h2 className="text-lg font-bold text-yellow-400">Tax Information</h2>
          <p className="text-sm text-gray-300">Configure your organization tax details to ensure compliant invoicing.</p>
        </article>
      </div>
    </FooterPageLayout>
  );
}
