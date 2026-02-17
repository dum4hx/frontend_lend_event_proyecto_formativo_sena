import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  CreditCard,
  Minus,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Encabezado from "../components/Encabezado";
import PiePagina from "../components/PiePagina";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../contexts/useAuth";
import {
  getSubscriptionType,
  calculatePlanCost,
} from "../services/subscriptionTypeService";
import { createCheckoutSession } from "../services/billingService";
import { ApiError } from "../lib/api";
import type { SubscriptionType, PlanCostResult } from "../types/api";
import styles from "./Checkout.module.css";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDollars(amount: number): string {
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const planId = searchParams.get("plan") ?? "";
  const initialSeats = Math.max(1, Number(searchParams.get("seats")) || 1);

  const [plan, setPlan] = useState<SubscriptionType | null>(null);
  const [seatCount, setSeatCount] = useState(initialSeats);
  const [costResult, setCostResult] = useState<PlanCostResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ─── Load plan details ────────────────────────────────────────────────

  useEffect(() => {
    if (!planId) {
      setError("No plan specified. Please select a plan first.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await getSubscriptionType(planId);
        if (!cancelled) setPlan(res.data.subscriptionType);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load plan details.",
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
  }, [planId]);

  // ─── Recalculate cost when seats change ───────────────────────────────

  const recalculate = useCallback(async () => {
    if (!planId || !plan) return;
    setCalculating(true);
    try {
      const res = await calculatePlanCost(planId, seatCount);
      setCostResult(res.data);
    } catch {
      // Non-critical — the UI still shows the plan without breakdown
      setCostResult(null);
    } finally {
      setCalculating(false);
    }
  }, [planId, plan, seatCount]);

  useEffect(() => {
    if (plan) void recalculate();
  }, [plan, recalculate]);

  // ─── Seat controls ────────────────────────────────────────────────────

  const minSeats = 1;
  const maxSeats = plan?.maxSeats === -1 ? Infinity : (plan?.maxSeats ?? 1);

  const incrementSeats = () => {
    if (seatCount < maxSeats) setSeatCount((s) => s + 1);
  };

  const decrementSeats = () => {
    if (seatCount > minSeats) setSeatCount((s) => s - 1);
  };

  // ─── Checkout handler ─────────────────────────────────────────────────
  //
  // Follows Stripe's recommended integration:
  //   1. Frontend calls the backend to create a Checkout Session.
  //   2. Backend returns the hosted Checkout URL.
  //   3. Frontend redirects the browser to Stripe's domain.
  //   4. Card data never touches our frontend (PCI-DSS compliant).
  //
  // See: https://docs.stripe.com/checkout/quickstart

  const handleCheckout = async () => {
    // Show login modal for unauthenticated users — keeps the
    // selected plan & seats intact so nothing is lost.
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // Only organization owners can purchase subscriptions
    if (user?.role !== "owner") {
      setError(
        "Only organization owners can purchase subscriptions. " +
          "Please contact your organization owner.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { origin } = window.location;
      const res = await createCheckoutSession({
        plan: planId,
        seatCount,
        successUrl: `${origin}/checkout/success`,
        cancelUrl: `${origin}/paquetes`,
      });

      // Redirect to Stripe Checkout — the only place card details are
      // entered.  This is PCI-DSS Level 1 compliant because no
      // sensitive payment data passes through our servers or frontend.
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to initiate checkout. Please try again.",
      );
      setSubmitting(false);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────

  const isDynamic = plan?.billingModel === "dynamic";

  // ─── Full-screen loading ──────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col">
        <Encabezado />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          <span className="ml-3 text-gray-400">Loading…</span>
        </main>
        <PiePagina />
      </div>
    );
  }

  // ─── Fatal error (no plan loaded) ─────────────────────────────────────

  if (error && !plan) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col">
        <Encabezado />
        <main className="flex-grow flex flex-col items-center justify-center px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-400 mb-6 text-center max-w-md">{error}</p>
          <Link
            to="/paquetes"
            className="text-yellow-400 underline hover:text-yellow-300"
          >
            ← Back to Plans
          </Link>
        </main>
        <PiePagina />
      </div>
    );
  }

  // ─── Main view ────────────────────────────────────────────────────────

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Encabezado />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Login modal */}
          <LoginModal
            open={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onAuthenticated={() => {
              setShowLoginModal(false);
              // Now authenticated — trigger checkout automatically
              void handleCheckout();
            }}
          />

          {/* Back link */}
          <Link
            to="/paquetes"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Link>

          {/* ── Plan summary card ─────────────────────────────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
            <h1 className="text-3xl font-extrabold mb-2">
              Subscribe to{" "}
              <span className="text-yellow-400">{plan?.displayName}</span>
            </h1>
            {plan?.description && (
              <p className="text-gray-500 mb-6">{plan.description}</p>
            )}

            {/* Seat selector — dynamic billing only */}
            {isDynamic && (
              <div className="bg-black/50 border border-zinc-800 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300">
                    Team Seats
                  </span>
                  <span className="text-sm text-gray-500">
                    {plan?.maxSeats === -1
                      ? "Unlimited available"
                      : `Max ${plan?.maxSeats} seats`}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={decrementSeats}
                    disabled={seatCount <= minSeats}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Remove seat"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-grow text-center">
                    <span className="text-2xl font-bold">{seatCount}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {seatCount === 1 ? "seat" : "seats"}
                    </span>
                  </div>

                  <button
                    onClick={incrementSeats}
                    disabled={seatCount >= maxSeats}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Add seat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            <div className="border-t border-zinc-800 pt-5 space-y-3">
              {costResult ? (
                <>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Base price</span>
                    <span>${formatDollars(costResult.baseCost)}/mo</span>
                  </div>
                  {isDynamic && costResult.seatCost > 0 && (
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>
                        Seats ({seatCount} &times;{" "}
                        ${formatDollars(costResult.seatCost / seatCount)})
                      </span>
                      <span>${formatDollars(costResult.seatCost)}/mo</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-800">
                    <span>Total</span>
                    <span className="text-yellow-400">
                      ${formatDollars(costResult.totalCost)}/mo
                    </span>
                  </div>
                </>
              ) : calculating ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">
                    Calculating…
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={submitting || !plan}
            className={`w-full bg-yellow-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.glowButton}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Stripe…
              </>
            ) : !isLoggedIn ? (
              <>
                <Lock className="w-5 h-5" />
                Sign in & Subscribe
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Subscribe Now
              </>
            )}
          </button>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>PCI-DSS Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
