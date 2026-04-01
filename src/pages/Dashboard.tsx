import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLanguage } from "../contexts/useLanguage";
import styles from './Dashboard.module.css'
import { Package, ArrowRightLeft, MapPin, BarChart3, AlertTriangle, Zap, Quote } from 'lucide-react'

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="bg-black text-white min-h-screen flex flex-col selection:bg-yellow-400 selection:text-black">

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 py-20 md:py-28">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-block py-1.5 px-4 text-[10px] md:text-xs font-bold tracking-widest text-yellow-400 uppercase border border-yellow-400/20 rounded-full bg-yellow-400/5">
                {t("publicSite.home.badge")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
              {t("publicSite.home.titlePrefix")}<br />
              <span className="text-yellow-400">{t("publicSite.home.titleHighlight")}</span>
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12">
              {t("publicSite.home.description")}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/sign-up">
                <button className={`w-full sm:w-auto bg-yellow-400 text-black px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 ${styles.glow_button}`}>
                  {t("publicSite.home.ctaPrimary")}
                </button>
              </a>
              <a href="/login">
                <button className="w-full sm:w-auto bg-transparent border border-gray-700 hover:border-gray-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:bg-gray-900/50">
                  {t("publicSite.home.ctaSecondary")}
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* Problem → Solution Section */}
        <section className="px-6 py-16 md:py-24 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Problem */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {t("publicSite.home.problemTitle")}
                </h2>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t("publicSite.home.problemDescription")}
              </p>
              <ul className="space-y-3">
                {[
                  t("publicSite.home.problemBullet1"),
                  t("publicSite.home.problemBullet2"),
                  t("publicSite.home.problemBullet3"),
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {t("publicSite.home.solutionTitle")}
                </h2>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t("publicSite.home.solutionDescription")}
              </p>
              <ul className="space-y-3">
                {[
                  t("publicSite.home.solutionBullet1"),
                  t("publicSite.home.solutionBullet2"),
                  t("publicSite.home.solutionBullet3"),
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-16 md:py-24 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-12">
              {t("publicSite.home.featuresTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Package, title: t("publicSite.home.featureInventoryTitle"), description: t("publicSite.home.featureInventoryDescription") },
                { icon: ArrowRightLeft, title: t("publicSite.home.featureLoansTitle"), description: t("publicSite.home.featureLoansDescription") },
                { icon: MapPin, title: t("publicSite.home.featureLocationsTitle"), description: t("publicSite.home.featureLocationsDescription") },
                { icon: BarChart3, title: t("publicSite.home.featureDashboardsTitle"), description: t("publicSite.home.featureDashboardsDescription") },
              ].map(({ icon: Icon, title, description }) => (
                <div key={title} className="card p-6 space-y-3 hover:border-yellow-400/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="px-6 py-16 md:py-24 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-12">
              {t("publicSite.home.socialProofTitle")}
            </h2>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                { quote: t("publicSite.home.testimonial1Quote"), name: t("publicSite.home.testimonial1Name"), role: t("publicSite.home.testimonial1Role") },
                { quote: t("publicSite.home.testimonial2Quote"), name: t("publicSite.home.testimonial2Name"), role: t("publicSite.home.testimonial2Role") },
              ].map(({ quote, name, role }) => (
                <div key={name} className="card p-6 space-y-4">
                  <Quote className="w-6 h-6 text-yellow-400/60" />
                  <p className="text-gray-300 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                  <div>
                    <p className="font-bold text-white text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: t("publicSite.home.stat1Value"), label: t("publicSite.home.stat1Label") },
                { value: t("publicSite.home.stat2Value"), label: t("publicSite.home.stat2Label") },
                { value: t("publicSite.home.stat3Value"), label: t("publicSite.home.stat3Label") },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl md:text-4xl font-extrabold text-yellow-400">{value}</p>
                  <p className="text-sm text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 py-16 md:py-20 border-t border-zinc-900 bg-yellow-400/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
              {t("publicSite.home.ctaBannerTitle")}
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {t("publicSite.home.ctaBannerDescription")}
            </p>
            <a href="/sign-up">
              <button className={`bg-yellow-400 text-black px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 ${styles.glow_button}`}>
                {t("publicSite.home.ctaBannerButton")}
              </button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
