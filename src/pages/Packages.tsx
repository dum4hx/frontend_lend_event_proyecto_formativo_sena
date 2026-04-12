import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Check,
  Loader2,
  AlertCircle,
  Package,
  Users,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getAvailablePlans } from "../services/organizationService";
import { getSubscriptionTypesPublic } from "../services/subscriptionTypeService";
import { getPaymentStatus } from "../services/authService";
import { ApiError } from "../lib/api";
import type { AvailablePlan } from "../types/api";
import styles from "./Packages.module.css";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import LoginModal from "../components/LoginModal";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Format a monthly price in dollars. */
function formatPrice(amount: number | null | undefined, locale: string): string {
  if (amount === null || amount === undefined) return "No price";
  const value = Number(amount);
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Active Subscription Modal ─────────────────────────────────────────────

interface ActiveSubscriptionModalProps {
  plan: string;
  onManage: () => void;
  onClose: () => void;
}

interface ActivationInfoModalProps {
  onViewPlans: () => void;
  onClose: () => void;
}

function ActivationInfoModal({ onViewPlans, onClose }: ActivationInfoModalProps) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-700 rounded-3xl max-w-xl w-full shadow-2xl p-0">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500" />

        <div className="p-8 md:p-9">
          <div className="mx-auto mb-5 w-fit rounded-full border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </div>

          <div className="text-center mb-6">
            <span className="inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-yellow-300 mb-3">
              {t("publicSite.packages.activation.badge")}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
              {t("publicSite.packages.activation.title")}
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {t("publicSite.packages.activation.description")}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/60 p-4 mb-7">
            <p className="text-gray-200 text-sm md:text-[15px] leading-relaxed text-center">
              {t("publicSite.packages.activation.summary")}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-gray-300">
                {t("publicSite.packages.activation.tag.fullAccess")}
              </span>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-gray-300">
                {t("publicSite.packages.activation.tag.allFeatures")}
              </span>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-gray-300">
                {t("publicSite.packages.activation.tag.instant")}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onViewPlans}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-3 rounded-xl transition-colors text-sm"
            >
              {t("publicSite.packages.activation.viewPlans")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-zinc-600 hover:border-zinc-400 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {t("publicSite.packages.activation.notNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveSubscriptionModal({ plan, onManage, onClose }: ActiveSubscriptionModalProps) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full shadow-2xl p-8 flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-yellow-400/10 p-4">
          <ShieldCheck className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t("publicSite.packages.activeSubscription.title")}</h2>
        <p className="text-gray-400 text-sm mb-2">
          {t("publicSite.packages.activeSubscription.description", { plan })}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {t("publicSite.packages.activeSubscription.note")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onManage}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            {t("publicSite.packages.activeSubscription.manage")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-600 hover:border-zinc-400 text-gray-300 hover:text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────

type PublicPlan = AvailablePlan & {
  description?: string;
  basePriceMonthly: number;
  durationDays?: number;
};

interface PlanCardProps {
  plan: PublicPlan;
  featured: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, featured, onSelect }: PlanCardProps) {
  const { locale, t } = useLanguage();
  const isUnlimited = (n: number) => n === -1;
  const isFreePlan = plan.basePriceMonthly === 0 && (plan.pricePerSeat ?? 0) <= 0;

  return (
    <div
      className={`relative flex flex-col p-8 transition-all ${
        featured
          ? "bg-zinc-900 border-2 border-yellow-400 shadow-2xl scale-105 rounded-3xl"
          : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-2xl"
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
          {t("publicSite.packages.card.mostPopular")}
        </div>
      )}

      {/* Header */}
      <div className="text-left mb-6">
        <h3 className="text-xl font-bold">{plan.displayName}</h3>
        {plan.description && <p className="text-gray-500 text-sm mt-1">{plan.description}</p>}
      </div>

      {/* Price */}
      <div className="text-left mb-6">
        <span className={`font-extrabold ${featured ? "text-5xl" : "text-4xl"}`}>
          {isFreePlan ? t("publicSite.packages.card.free") : `$${formatPrice(plan.basePriceMonthly, locale)}`}
        </span>
        {plan.durationDays != null && (
          <span className="text-gray-500 ml-2 text-base font-normal">
            /{" "}
            {plan.durationDays === 30
              ? t("publicSite.packages.card.interval.month")
              : plan.durationDays === 365
                ? t("publicSite.packages.card.interval.year")
                : t("publicSite.packages.card.interval.days", { days: plan.durationDays })}
          </span>
        )}
        {plan.billingModel === "dynamic" && plan.pricePerSeat > 0 && (
          <p className="text-gray-500 text-sm mt-1">+ ${formatPrice(plan.pricePerSeat, locale)} {t("publicSite.packages.card.perSeat")}</p>
        )}
      </div>

      {/* Limits */}
      <div className="flex gap-4 mb-6 text-left">
        <div className="flex items-center text-gray-400 text-xs">
          <Users className="w-4 h-4 mr-1.5 text-yellow-400/70" />
          {isUnlimited(plan.maxSeats)
            ? t("publicSite.packages.card.limits.unlimited")
            : t("publicSite.packages.card.limits.upToSeats", { seats: plan.maxSeats })}
        </div>
        <div className="flex items-center text-gray-400 text-xs">
          <LayoutGrid className="w-4 h-4 mr-1.5 text-yellow-400/70" />
          {isUnlimited(plan.maxCatalogItems)
            ? t("publicSite.packages.card.limits.unlimited")
            : t("publicSite.packages.card.limits.items", { items: plan.maxCatalogItems })}
        </div>
      </div>

      {/* Features */}
      <ul className="text-left space-y-3 mb-8 flex-grow text-sm">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start text-gray-300">
            <Check className="w-4 h-4 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={`w-full bg-yellow-400 text-black font-bold rounded-xl transition-all ${
          featured ? "py-4" : "py-3"
        } ${styles.glowButton}`}
      >
        {t("publicSite.packages.card.getStarted")}
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Packages() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const plansSectionRef = useRef<HTMLElement | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLoggedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [showActiveSubModal, setShowActiveSubModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);

  const loadPlans = useCallback(async (cancelled: boolean) => {
    try {
      setLoading(true);
      setError("");

      const res = await getAvailablePlans();
      if (cancelled) return;
      setPlans(res.data.plans);
    } catch {
      if (cancelled) return;
      // Fallback: fetch subscription types publicly and map to AvailablePlan
      try {
        const alt = await getSubscriptionTypesPublic();
        if (cancelled) return;
        const mapped = alt.data.subscriptionTypes.map((t) => {
          return {
            name: t.plan,
            displayName: t.displayName,
            billingModel: t.billingModel,
            maxCatalogItems: t.maxCatalogItems,
            maxSeats: t.maxSeats,
            features: t.features,
            basePriceMonthly: t.basePriceMonthly,
            pricePerSeat: t.pricePerSeat,
            description: t.description,
            durationDays: t.durationDays,
          } as PublicPlan;
        });
        setPlans(mapped);
        setError("");
      } catch (err2) {
        setError(
          err2 instanceof ApiError ? err2.message : t("publicSite.packages.error.loadFailed"),
        );
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasActivationQuery = params.get("activationModal") === "1";
    const shouldShowModal =
      hasActivationQuery ||
      Boolean(
      (
        location.state as {
          showActivationModal?: boolean;
        } | null
      )?.showActivationModal,
    );

    if (!shouldShowModal) return;

    setShowActivationModal(true);
    // Clear one-time triggers so the modal only auto-opens once.
    if (hasActivationQuery) {
      params.delete("activationModal");
    }
    const cleanSearch = params.toString();
    navigate(`${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  // After returning from /sign-up via returnTo, auto-navigate to checkout
  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(location.search);
    const plan = params.get("plan");
    if (plan) {
      // Check subscription status first before sending to checkout
      getPaymentStatus()
        .then((res) => {
          if (res.data.isActive) {
            setActivePlan(res.data.plan);
            setShowActiveSubModal(true);
          } else {
            navigate(`/checkout?plan=${encodeURIComponent(plan)}`, { replace: true });
          }
        })
        .catch(() => {
          navigate(`/checkout?plan=${encodeURIComponent(plan)}`, { replace: true });
        });
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;

    void loadPlans(cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadPlans]);

  const handleSelect = (plan: PublicPlan) => {
    // If unauthenticated, open login/register modal and remember selection
    if (!isLoggedIn) {
      setPendingPlan(plan.name);
      setShowLoginModal(true);
      return;
    }

    // Block if there is already an active subscription
    if (activePlan) {
      setShowActiveSubModal(true);
      return;
    }

    // Authenticated users without active sub go straight to checkout
    navigate(`/checkout?plan=${encodeURIComponent(plan.name)}`);
  };

  // Register return URL — sends the user back here with the plan pre-selected
  const registerReturnTo = pendingPlan
    ? `/packages?plan=${encodeURIComponent(pendingPlan)}`
    : "/packages";

  // Highlight the middle card when there are 3+ plans
  const featuredIdx = plans.length >= 3 ? Math.floor(plans.length / 2) : -1;

  // Responsive grid that keeps cards evenly distributed
  const gridCols =
    plans.length === 1
      ? "grid-cols-1 max-w-md"
      : plans.length === 2
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl";

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow py-16 px-4">
        <section ref={plansSectionRef} className="max-w-7xl mx-auto text-center mb-20">
          {showActivationModal && (
            <ActivationInfoModal
              onViewPlans={() => {
                setShowActivationModal(false);
                plansSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onClose={() => setShowActivationModal(false)}
            />
          )}

          {/* Active subscription warning modal */}
          {showActiveSubModal && activePlan && (
            <ActiveSubscriptionModal
              plan={activePlan}
              onManage={() => navigate("/app/subscription")}
              onClose={() => setShowActiveSubModal(false)}
            />
          )}

          {/* Login/Register modal — shown when unauthenticated user clicks Get Started */}
          <LoginModal
            open={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            registerReturnTo={registerReturnTo}
            postAuthRedirect={
              pendingPlan ? `/checkout?plan=${encodeURIComponent(pendingPlan)}` : undefined
            }
          />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            {t("publicSite.packages.hero.titlePrefix")} <span className="text-yellow-400">{t("publicSite.packages.hero.titleHighlight")}</span>
          </h2>
          <p className="text-gray-400 mb-12 text-lg">{t("publicSite.packages.hero.subtitle")}</p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              <span className="ml-3 text-gray-400">{t("publicSite.packages.loading")}</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => {
                  void loadPlans(false);
                }}
                className="text-sm text-yellow-400 underline hover:text-yellow-300"
              >
                {t("publicSite.packages.retry")}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && plans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>{t("publicSite.packages.empty")}</p>
            </div>
          )}

          {/* Plan cards */}
          {!loading && !error && plans.length > 0 && (
            <div className={`grid gap-8 items-stretch mx-auto ${gridCols}`}>
              {plans.map((plan, idx) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  featured={idx === featuredIdx}
                  onSelect={() => handleSelect(plan)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
