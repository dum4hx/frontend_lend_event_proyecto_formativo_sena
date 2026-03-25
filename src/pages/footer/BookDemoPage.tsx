import { Link } from "react-router-dom";
import FooterPageLayout from "./FooterPageLayout";
import { useLanguage } from "../../contexts/useLanguage";

export default function BookDemoPage() {
  const { t } = useLanguage();

  const demoBenefits = [
    t("publicSite.bookDemo.benefits.guidedWalkthrough"),
    t("publicSite.bookDemo.benefits.recommendations"),
    t("publicSite.bookDemo.benefits.liveQna"),
  ];

  const demoSteps = [
    {
      title: t("publicSite.bookDemo.steps.1.title"),
      description: t("publicSite.bookDemo.steps.1.description"),
    },
    {
      title: t("publicSite.bookDemo.steps.2.title"),
      description: t("publicSite.bookDemo.steps.2.description"),
    },
    {
      title: t("publicSite.bookDemo.steps.3.title"),
      description: t("publicSite.bookDemo.steps.3.description"),
    },
  ];

  return (
    <FooterPageLayout
      title={t("publicSite.bookDemo.title")}
      subtitle={t("publicSite.bookDemo.subtitle")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card space-y-5">
          <h2 className="text-2xl font-bold text-yellow-400">{t("publicSite.bookDemo.whatYouGet")}</h2>
          <ul className="space-y-3">
            {demoBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-gray-300">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.1)] px-5 py-2.5 text-sm font-bold text-[#FFD700] transition-colors hover:border-[rgba(255,215,0,0.55)] hover:bg-[rgba(255,215,0,0.18)]"
            >
              {t("publicSite.bookDemo.startBooking")}
            </Link>
          </div>
        </section>

        <aside className="card space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">{t("publicSite.bookDemo.averageSession")}</h3>
          <p className="text-gray-300">{t("publicSite.bookDemo.sessionDuration")}</p>
          <p className="text-sm text-gray-400">
            {t("publicSite.bookDemo.sessionNote")}
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("publicSite.bookDemo.contact")}</p>
            <p className="mt-2 text-sm text-gray-300">demo@lendevent.com</p>
            <p className="text-sm text-gray-400">+57 601 000 2000</p>
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">{t("publicSite.bookDemo.howItWorks")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoSteps.map((step, index) => (
            <article key={step.title} className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {t("publicSite.bookDemo.step", { number: String(index + 1) })}
              </p>
              <h3 className="text-lg font-bold text-yellow-400">{step.title}</h3>
              <p className="text-gray-300 leading-relaxed">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </FooterPageLayout>
  );
}
