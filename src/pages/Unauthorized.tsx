import { Link } from "react-router-dom";
import { Home, ShieldOff } from "lucide-react";
import { useLanguage } from "../contexts/useLanguage";

export default function Unauthorized() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-8">
          <ShieldOff size={48} className="text-red-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">{t("unauthorized.title")}</h1>

        <p className="text-gray-400 mb-10 leading-relaxed">{t("unauthorized.message")}</p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
          >
            <Home size={18} />
            {t("unauthorized.goHome")}
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 border border-[#333] text-gray-300 hover:text-white hover:border-[#555] px-6 py-3 rounded-lg transition"
          >
            {t("unauthorized.signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
