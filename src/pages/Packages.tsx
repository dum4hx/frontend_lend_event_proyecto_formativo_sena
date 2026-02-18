import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Loader2,
  AlertCircle,
  Package,
  Users,
  LayoutGrid,
  ShieldCheck,
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
import LoginModal from "../components/LoginModal";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Format a monthly price in dollars. */
function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "No price";
  const value = Number(amount);
  return value.toLocaleString("en-US", {
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

function ActiveSubscriptionModal({ plan, onManage, onClose }: ActiveSubscriptionModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full shadow-2xl p-8 flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-yellow-400/10 p-4">
          <ShieldCheck className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Active Subscription</h2>
        <p className="text-gray-400 text-sm mb-2">
          You already have an active <span className="text-yellow-400 font-semibold capitalize">{plan}</span> subscription.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You cannot purchase a new plan while your current subscription is active. To upgrade, downgrade, or manage billing, visit the Subscription Management page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onManage}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            Manage Subscription
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-600 hover:border-zinc-400 text-gray-300 hover:text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────

type PublicPlan = AvailablePlan & { description?: string };

interface PlanCardProps {
  plan: PublicPlan;
  featured: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, featured, onSelect }: PlanCardProps) {
  const isUnlimited = (n: number) => n === -1;

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
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="text-left mb-6">
        <h3 className="text-xl font-bold">{plan.displayName}</h3>
        {plan.description && (
          <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="text-left mb-6">
        <span
          className={`font-extrabold ${featured ? "text-5xl" : "text-4xl"}`}
        >
          ${formatPrice(plan.basePriceMonthly)}
        </span>
        <span className="text-gray-500 ml-1">/mo</span>
        {plan.billingModel === "dynamic" && plan.pricePerSeat > 0 && (
          <p className="text-gray-500 text-sm mt-1">
            + ${formatPrice(plan.pricePerSeat)}/seat/mo
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="flex gap-4 mb-6 text-left">
        <div className="flex items-center text-gray-400 text-xs">
          <Users className="w-4 h-4 mr-1.5 text-yellow-400/70" />
          {isUnlimited(plan.maxSeats)
            ? "Unlimited"
            : `Up to ${plan.maxSeats}`}{" "}
          seats
        </div>
        <div className="flex items-center text-gray-400 text-xs">
          <LayoutGrid className="w-4 h-4 mr-1.5 text-yellow-400/70" />
          {isUnlimited(plan.maxCatalogItems)
            ? "Unlimited"
            : plan.maxCatalogItems}{" "}
          items
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
        Get Started
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Packages() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isLoggedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [showActiveSubModal, setShowActiveSubModal] = useState(false);

  // Check for an existing active subscription when the user is logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    getPaymentStatus()
      .then((res) => {
        if (res.data.isActive) {
          setActivePlan(res.data.plan);
          setShowActiveSubModal(true);
        }
      })
      .catch(() => {
        // Ignore — if the check fails we don't block the user
      });
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getAvailablePlans();
        console.log("API RESPONSE:", res.data);
        if (cancelled) return;
        setPlans(res.data.plans);
      } catch  {
        if (cancelled) return;
        // Fallback: fetch subscription types publicly and map to AvailablePlan
        try {
          const alt = await getSubscriptionTypesPublic();
          if (cancelled) return;
          const mapped = alt.data.subscriptionTypes.map((t: any) => {
            const hasMonthly = typeof t.basePriceMonthly === "number";
            const basePriceMonthly = hasMonthly
              ? t.basePriceMonthly
              : (typeof t.baseCost === "number" ? t.baseCost : null);
            const pricePerSeat = typeof t.pricePerSeat === "number"
              ? (hasMonthly ? t.pricePerSeat : t.pricePerSeat)
              : 0;

            return {
              name: t.plan,
              displayName: t.displayName,
              billingModel: t.billingModel,
              maxCatalogItems: t.maxCatalogItems ?? 0,
              maxSeats: t.maxSeats ?? 1,
              features: t.features ?? [],
              basePriceMonthly,
              pricePerSeat,
              description: t.description,
            } as PublicPlan;
          });
          setPlans(mapped);
          setError("");
        } catch (err2) {
          setError(
            err2 instanceof ApiError
              ? err2.message
              : "Failed to load plans. Please try again later.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (plan: PublicPlan) => {
    // If unauthenticated, open login/register modal and remember selection
    if (!isLoggedIn) {
      setPendingPlan(plan.name);
      try {
        localStorage.setItem("pendingCheckoutPlan", plan.name);
      } catch {
        // ignore storage failures
      }
      setShowLoginModal(true);
      return;
    }

    // Block if there is already an active subscription
    if (activePlan) {
      setShowActiveSubModal(true);
      return;
    }

    // Authenticated users go straight to checkout
    navigate(`/checkout?plan=${encodeURIComponent(plan.name)}`);
  };

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
        <section className="max-w-7xl mx-auto text-center mb-20">
          {/* Active subscription warning modal */}
          {showActiveSubModal && activePlan && (
            <ActiveSubscriptionModal
              plan={activePlan}
              onManage={() => navigate("/admin/subscription")}
              onClose={() => setShowActiveSubModal(false)}
            />
          )}

          {/* Login/Register modal — shown when unauthenticated user clicks Get Started */}
          <LoginModal
            open={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onAuthenticated={() => {
              setShowLoginModal(false);
              const planName = pendingPlan ?? localStorage.getItem("pendingCheckoutPlan");
              if (planName) {
                try { localStorage.removeItem("pendingCheckoutPlan"); } 
                catch {
                  /* Empty fallback */
                  } 
                navigate(`/checkout?plan=${encodeURIComponent(planName)}`);
              }
            }}
          />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Simple <span className="text-yellow-400">Pricing</span>
          </h2>
          <p className="text-gray-400 mb-12 text-lg">
            Choose the perfect plan for your business
          </p>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              <span className="ml-3 text-gray-400">Loading plans…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-yellow-400 underline hover:text-yellow-300"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && plans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>No plans available at this time. Check back soon!</p>
            </div>
          )}

          {/* Plan cards */}
          {!loading && !error && plans.length > 0 && (
            <div
              className={`grid gap-8 items-stretch mx-auto ${gridCols}`}
            >
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
