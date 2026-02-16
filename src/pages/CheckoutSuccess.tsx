import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import Encabezado from "../components/Encabezado";
import PiePagina from "../components/PiePagina";
import { useAuth } from "../contexts/useAuth";

export default function CheckoutSuccess() {
  const { checkAuth } = useAuth();
  const [synced, setSynced] = useState(false);

  // Refresh auth state so the sidebar / layout picks up the new subscription
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      await checkAuth();
      if (!cancelled) setSynced(true);
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Encabezado />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />

          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Subscription{" "}
            <span className="text-yellow-400">Activated!</span>
          </h1>

          <p className="text-gray-400 mb-8 text-lg">
            Your payment was processed successfully. Your subscription is now
            active and your team is ready to go.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/paquetes"
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
            >
              View Plans
            </Link>
          </div>

          {!synced && (
            <p className="text-gray-600 text-xs mt-8">
              Syncing your account…
            </p>
          )}
        </div>
      </main>

      <PiePagina />
    </div>
  );
}
