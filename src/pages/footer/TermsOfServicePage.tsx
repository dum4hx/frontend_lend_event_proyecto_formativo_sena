import FooterPageLayout from "./FooterPageLayout";

const sections = [
  {
    title: "Service Scope",
    content:
      "LendEvent provides software services designed to support event rental operations, inventory oversight, team coordination, and billing-related workflows. Access to specific features, usage thresholds, and service levels may vary according to the subscription selected by the customer organization.",
  },
  {
    title: "Account Responsibilities",
    content:
      "Each customer is responsible for maintaining complete and accurate account information, safeguarding credentials, managing user permissions appropriately, and ensuring that all authorized users comply with applicable internal policies and these terms.",
  },
  {
    title: "Subscription and Payments",
    content:
      "Paid subscriptions renew in accordance with the active billing cycle unless cancelled under the applicable terms. Taxes, seat adjustments, plan upgrades, downgrades, and other commercial changes may affect the invoiced amount. Non-payment, charge disputes, or repeated billing failures may result in suspension of access to protected services.",
  },
  {
    title: "Acceptable Use",
    content:
      "Customers may not use the platform to store or transmit unlawful material, infringe third-party rights, attempt unauthorized access, disrupt service availability, reverse engineer protected functionality where prohibited, or interfere with the security, stability, or integrity of the platform or other customer environments.",
  },
  {
    title: "Data and Availability",
    content:
      "LendEvent applies commercially reasonable technical and organizational safeguards to protect customer data and support service continuity. However, the customer acknowledges that scheduled maintenance, dependency failures, internet disruptions, force majeure events, or third-party outages may temporarily affect service performance or availability.",
  },
  {
    title: "Termination",
    content:
      "LendEvent may suspend or terminate access where necessary to address material breach, security risk, unlawful use, or persistent non-payment. Customers may request cancellation subject to the applicable subscription commitments, notice periods, and any outstanding payment obligations accrued before the effective termination date.",
  },
];

export default function TermsOfServicePage() {
  return (
    <FooterPageLayout
      title="Terms of Service"
      subtitle="These terms describe the conditions under which organizations access and use the LendEvent platform."
    >
      <section className="card space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Legal Notice
            </p>
            <h2 className="text-xl font-bold text-white">Platform Terms</h2>
          </div>
          <p className="text-sm text-gray-400">Last updated: March 16, 2026</p>
        </div>
        <p className="text-gray-300 leading-relaxed">
          These Terms of Service govern access to and use of the LendEvent platform by customer organizations and their authorized users. By accessing the service, the customer agrees to comply with these terms and all applicable laws and regulations.
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
        <h2 className="text-xl font-bold text-yellow-400">Legal and Compliance Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          Questions regarding contractual terms, compliance matters, or formal legal notices may be directed to our legal team.
        </p>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Email: legal@lendevent.com</p>
          <p>Compliance: compliance@lendevent.com</p>
          <p>Response window: 3 to 5 business days</p>
        </div>
      </section>
    </FooterPageLayout>
  );
}
