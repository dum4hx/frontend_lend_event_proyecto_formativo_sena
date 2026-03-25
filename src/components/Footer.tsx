import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/useLanguage";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-20 border-t border-zinc-900 bg-black text-zinc-300">
      <div className="mx-auto max-w-7xl px-6 py-12 text-sm md:py-14">
        <section className="mb-10 grid grid-cols-1 gap-6 rounded-2xl border border-zinc-900 bg-zinc-950/55 p-6 md:grid-cols-[1.7fr_1fr] md:items-center md:p-7">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/lendevent-logo.png"
                alt="LendEvent"
                className="h-14 w-auto"
              />
              <div className="flex flex-col leading-snug">
                <span className="text-base font-bold text-white">Lend</span>
                <span className="text-base font-bold text-[#FFD700]">Event</span>
              </div>
            </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("publicSite.footer.platform")}</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {t("publicSite.footer.heroTitle")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                {t("publicSite.footer.heroDescription")}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(255,215,0,0.34)] bg-[rgba(255,215,0,0.08)] px-5 py-2.5 text-sm font-bold text-[#FFD700] transition-colors hover:border-[rgba(255,215,0,0.54)] hover:bg-[rgba(255,215,0,0.16)]"
            >
                {t("publicSite.nav.bookDemo")}
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
                {t("publicSite.footer.startFreeTrial")}
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
          <div>
            <h6 className="mb-4 font-bold text-white">{t("publicSite.footer.support")}</h6>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link to="/contact" className="transition-colors hover:text-white">{t("publicSite.footer.contact")}</Link></li>
              <li><Link to="/billing" className="transition-colors hover:text-white">{t("publicSite.footer.billing")}</Link></li>
            </ul>
          </div>

          <div>
            <h6 className="mb-4 font-bold text-white">{t("publicSite.footer.company")}</h6>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link to="/about" className="transition-colors hover:text-white">{t("publicSite.footer.about")}</Link></li>
              <li><Link to="/business" className="transition-colors hover:text-white">{t("publicSite.footer.business")}</Link></li>
              <li><Link to="/pricing" className="transition-colors hover:text-white">{t("publicSite.footer.pricing")}</Link></li>
              <li><Link to="/blog" className="transition-colors hover:text-white">{t("publicSite.footer.blog")}</Link></li>
            </ul>
          </div>

          <div>
            <h6 className="mb-4 font-bold text-white">{t("publicSite.footer.resources")}</h6>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link to="/whats-new" className="transition-colors hover:text-white">{t("publicSite.footer.whatsNew")}</Link></li>
              <li><Link to="/help-center" className="transition-colors hover:text-white">{t("publicSite.footer.helpCenter")}</Link></li>
            </ul>
          </div>

          <div>
            <h6 className="mb-4 font-bold text-white">{t("publicSite.footer.location")}</h6>
            <div className="mb-5 flex items-center gap-2 text-zinc-300">
              <img
                src="https://flagcdn.com/w20/co.png"
                alt="Colombia"
                className="h-auto w-5"
              />
              <span>Colombia</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Facebook
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                YouTube
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                X
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          <span>{t("publicSite.footer.rights")}</span>
          <Link to="/terms-of-service" className="transition-colors hover:text-white">{t("publicSite.footer.termsOfService")}</Link>
          <Link to="/cookie-policy" className="transition-colors hover:text-white">{t("publicSite.footer.cookiePolicy")}</Link>
          <span className="hidden md:inline">{t("publicSite.footer.tagline")}</span>
        </div>
      </div>
    </footer>
  )
}
