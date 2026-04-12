import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/useLanguage";
import { useAuth } from "../contexts/useAuth";
import { usePermissions } from "../contexts/usePermissions";
import { getNavItemsByPrefix } from "../config/modulePermissions";
import { APP_ROUTES } from "../config/routes";

export default function NotFound() {
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { hasAnyPermission } = usePermissions();

  const homeRoute = useMemo(() => {
    if (!isLoggedIn) return APP_ROUTES.publicHome;
    const firstVisible = getNavItemsByPrefix("/app").find(
      (item) => item.requiredPermissions.length === 0 || hasAnyPermission(item.requiredPermissions),
    );
    return firstVisible?.path ?? APP_ROUTES.publicHome;
  }, [isLoggedIn, hasAnyPermission]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Big 404 */}
        <h1 className="text-[120px] font-extrabold text-[#FFD700] leading-none select-none">404</h1>

        <h2 className="text-2xl font-bold text-white mt-4 mb-3">{t("notFound.title")}</h2>

        <p className="text-gray-400 mb-10 leading-relaxed">
          {t("notFound.message")}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to={homeRoute}
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
          >
            <Home size={18} />
            {t("notFound.goHome")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 border border-[#333] text-gray-300 hover:text-white hover:border-[#555] px-6 py-3 rounded-lg transition"
          >
            <ArrowLeft size={18} />
            {t("notFound.goBack")}
          </button>
        </div>
      </div>
    </div>
  );
}
