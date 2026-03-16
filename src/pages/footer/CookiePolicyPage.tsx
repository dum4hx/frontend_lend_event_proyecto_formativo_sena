import FooterPageLayout from "./FooterPageLayout";

const cookieSections = [
  {
    title: "Essential Cookies",
    content:
      "Essential cookies are used to maintain secure sessions, support authentication and access control, prevent fraudulent activity, and preserve core platform functionality required for safe operation of the service.",
  },
  {
    title: "Functional Cookies",
    content:
      "Functional cookies may store selected preferences such as interface behavior, language, or workflow-related settings in order to provide a more consistent and efficient experience for returning users.",
  },
  {
    title: "Analytics and Performance",
    content:
      "Analytics and performance technologies may be used to understand page usage patterns, identify stability or performance issues, and improve product decisions. Where possible, these tools are configured to limit unnecessary collection of personal data.",
  },
  {
    title: "Third-Party Services",
    content:
      "Certain cookies may be set by integrated third-party services, including payment processors or embedded tools, when those services are actively used by the customer as part of the platform experience.",
  },
  {
    title: "Managing Cookies",
    content:
      "Users may manage cookie preferences through supported browser controls or device settings. Disabling certain categories may affect secure sign-in, billing flows, session continuity, or the availability of personalized settings within the application.",
  },
];

export default function CookiePolicyPage() {
  return (
    <FooterPageLayout
      title="Cookie Policy"
      subtitle="This policy explains how cookies and similar technologies are used across the LendEvent experience."
    >
      <section className="card space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Privacy Notice
            </p>
            <h2 className="text-xl font-bold text-white">Use of Cookies</h2>
          </div>
          <p className="text-sm text-gray-400">Last updated: March 16, 2026</p>
        </div>
        <p className="text-gray-300 leading-relaxed">
          This Cookie Policy explains how LendEvent uses cookies and similar technologies to operate, secure, analyze, and improve the platform. By continuing to use the service, users acknowledge the use of these technologies as described in this policy, subject to applicable law.
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
        <h2 className="text-xl font-bold text-yellow-400">Privacy and Compliance Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          For questions related to cookies, privacy expectations, or compliance requests, users may contact our privacy and legal teams.
        </p>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Email: privacy@lendevent.com</p>
          <p>Legal: legal@lendevent.com</p>
          <p>Response window: 3 to 5 business days</p>
        </div>
      </section>
    </FooterPageLayout>
  );
}
