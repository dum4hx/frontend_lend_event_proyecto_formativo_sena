import { Link } from "react-router-dom";
import { Home, ShieldOff } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-8">
          <ShieldOff size={48} className="text-red-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Access Denied</h1>

        <p className="text-gray-400 mb-10 leading-relaxed">
          You don't have permission to access this resource. If you believe this is an error, please
          contact your administrator or return to the home page.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
          >
            <Home size={18} />
            Go Home
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 border border-[#333] text-gray-300 hover:text-white hover:border-[#555] px-6 py-3 rounded-lg transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
