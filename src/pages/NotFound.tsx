import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Big 404 */}
        <h1 className="text-[120px] font-extrabold text-[#FFD700] leading-none select-none">404</h1>

        <h2 className="text-2xl font-bold text-white mt-4 mb-3">Page Not Found</h2>

        <p className="text-gray-400 mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Please check the URL or
          return to the home page.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
          >
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 border border-[#333] text-gray-300 hover:text-white hover:border-[#555] px-6 py-3 rounded-lg transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
