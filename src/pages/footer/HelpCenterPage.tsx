import FooterPageLayout from "./FooterPageLayout";
import { useLanguage } from "../../contexts/useLanguage";
import { Rocket, Package, ArrowRightLeft, CreditCard } from "lucide-react";

export default function HelpCenterPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Rocket,
      title: t("publicSite.helpCenter.gettingStarted"),
      description: t("publicSite.helpCenter.gettingStartedDescription"),
      bullets: [
        t("publicSite.helpCenter.gettingStartedBullet1"),
        t("publicSite.helpCenter.gettingStartedBullet2"),
        t("publicSite.helpCenter.gettingStartedBullet3"),
        t("publicSite.helpCenter.gettingStartedBullet4"),
      ],
    },
    {
      icon: Package,
      title: t("publicSite.helpCenter.inventoryTitle"),
      description: t("publicSite.helpCenter.inventoryDescription"),
      bullets: [
        t("publicSite.helpCenter.inventoryBullet1"),
        t("publicSite.helpCenter.inventoryBullet2"),
        t("publicSite.helpCenter.inventoryBullet3"),
        t("publicSite.helpCenter.inventoryBullet4"),
      ],
    },
    {
      icon: ArrowRightLeft,
      title: t("publicSite.helpCenter.loansTitle"),
      description: t("publicSite.helpCenter.loansDescription"),
      bullets: [
        t("publicSite.helpCenter.loansBullet1"),
        t("publicSite.helpCenter.loansBullet2"),
        t("publicSite.helpCenter.loansBullet3"),
        t("publicSite.helpCenter.loansBullet4"),
      ],
    },
    {
      icon: CreditCard,
      title: t("publicSite.helpCenter.billingTitle"),
      description: t("publicSite.helpCenter.billingDescription"),
      bullets: [
        t("publicSite.helpCenter.billingBullet1"),
        t("publicSite.helpCenter.billingBullet2"),
        t("publicSite.helpCenter.billingBullet3"),
        t("publicSite.helpCenter.billingBullet4"),
      ],
    },
  ];

  return (
    <FooterPageLayout
      title={t("publicSite.helpCenter.title")}
      subtitle={t("publicSite.helpCenter.subtitle")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(({ icon: Icon, title, description, bullets }) => (
          <article key={title} className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-yellow-400">{title}</h2>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
            <ul className="space-y-2 pt-1">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400/60 shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">{t("publicSite.helpCenter.faqTitle")}</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            { q: t("publicSite.helpCenter.faq1Question"), a: t("publicSite.helpCenter.faq1Answer") },
            { q: t("publicSite.helpCenter.faq2Question"), a: t("publicSite.helpCenter.faq2Answer") },
            { q: t("publicSite.helpCenter.faq3Question"), a: t("publicSite.helpCenter.faq3Answer") },
          ].map((item, i) => (
            <div key={i} className="card p-6 space-y-2 border border-zinc-900 hover:border-zinc-800 transition-all">
              <h3 className="text-white font-bold text-base flex items-start gap-3">
                <span className="text-yellow-400">Q:</span>
                {item.q}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed pl-7">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </FooterPageLayout>
  );
}
