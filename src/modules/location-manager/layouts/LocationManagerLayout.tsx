import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

export default function LocationManagerLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      {/* Content */}
      <main className="ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
