import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/useLanguage'
import styles from './Header.module.css'

const navItems = [
  { to: '/', key: 'publicSite.nav.home', end: true },
  { to: '/packages', key: 'publicSite.nav.packages' },
  { to: '/about', key: 'publicSite.nav.about' },
  { to: '/help-center', key: 'publicSite.nav.helpCenter' },
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { t } = useLanguage()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-[#050505]/92 text-white backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <img
              src="/lendevent-logo.png"
              alt="LendEvent"
              className="h-10 w-auto"
            />
            <div className="flex flex-col leading-snug">
              <span className="text-2xl text-white font-bold tracking-tight italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-400">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.nav_link} ${isActive ? styles.nav_link_active : ''}`
                }
              >
                {t(item.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 md:gap-3">

          <Link
            to="/book-demo"
            className="hidden lg:inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
          >
            {t('publicSite.nav.bookDemo')}
          </Link>
          <Link
            to="/login"
            className="hidden sm:block text-sm font-semibold text-white hover:text-gray-300 transition-colors"
          >
            {t('publicSite.nav.login')}
          </Link>
          <Link
            to="/sign-up"
            className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-bold ${styles.cta_button}`}
          >
            {t('publicSite.nav.signUp')}
          </Link>

          <button
            type="button"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950/70 text-zinc-100 transition-colors hover:border-zinc-500 hover:text-white"
            aria-label={isMobileMenuOpen ? t('publicSite.nav.closeMenu') : t('publicSite.nav.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className="text-lg leading-none">{isMobileMenuOpen ? 'X' : '≡'}</span>
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            id="mobile-navigation"
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-zinc-800 bg-zinc-950 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{t('publicSite.nav.navigation')}</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-200"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('publicSite.nav.closeMenu')}
              >
                X
              </button>
            </div>

            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `${styles.mobile_nav_link} ${isActive ? styles.mobile_nav_link_active : ''}`
                    }
                  >
                    {t(item.key)}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3 border-t border-zinc-800 pt-6">
              <Link
                to="/book-demo"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {t('publicSite.nav.bookDemo')}
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-transparent px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {t('publicSite.nav.login')}
              </Link>
              <Link
                to="/sign-up"
                className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold ${styles.cta_button}`}
              >
                {t('publicSite.nav.signUp')}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
