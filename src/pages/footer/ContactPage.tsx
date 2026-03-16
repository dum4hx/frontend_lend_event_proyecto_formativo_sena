import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function ContactPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "ContactPage",
  });

  const planCountLabel = data ? `${data.planCount} active plans` : "Updated plans";

  return (
    <FooterPageLayout
      title="Contact Our Team"
      subtitle="Need help with onboarding, integrations, or account setup? Our specialists are ready to guide your team."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading support channels...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="card space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">Sales & Partnerships</h2>
          <p className="text-gray-300 leading-relaxed">
            Talk to our commercial team to design a plan for your event operation.
          </p>
          <p className="text-sm text-gray-400">{planCountLabel} available for your team size.</p>
          <p className="text-sm text-gray-400">Email: sales@lendevent.com</p>
          <p className="text-sm text-gray-400">Phone: +57 601 000 1000</p>
        </article>

        <article className="card space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">Technical Support</h2>
          <p className="text-gray-300 leading-relaxed">
            Reach support for platform incidents, user access issues, or data import questions.
          </p>
          <p className="text-sm text-gray-400">Priority onboarding guidance for new organizations.</p>
          <p className="text-sm text-gray-400">Email: support@lendevent.com</p>
          <p className="text-sm text-gray-400">Hours: Monday to Friday, 8:00 AM to 6:00 PM (COT)</p>
        </article>
      </div>
    </FooterPageLayout>
  );
}
