import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Páginas públicas
import Dashboard from "./pages/Dashboard";
import Paquetes from "./pages/Paquetes";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import SobreNosotros from "./pages/SobreNosotros";
import RecuperarContrasena from "./pages/RecuperarContrasena";

// Fallback pages
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Admin (organization owner)
import AdminLayout from "./modules/admin/layouts/AdminLayout";
import AdminDashboard from "./modules/admin/pages/AdminDashboard";
import MyEvents from "./modules/admin/pages/MyEvents";
import Team from "./modules/admin/pages/Team";
import IASettings from "./modules/admin/pages/IA_Settings";
import Settings from "./modules/admin/pages/Settings";

// Super Admin
import SuperAdminLayout from "./modules/super-admin/layouts/SuperAdminLayout";
import SalesOverview from "./modules/super-admin/pages/SalesOverview";
import ClientManagement from "./modules/super-admin/pages/ClientManagement";
import PlanConfiguration from "./modules/super-admin/pages/PlanConfiguration";
import AIChatbotMonitor from "./modules/super-admin/pages/AIChatbotMonitor";
import SystemSettings from "./modules/super-admin/pages/SystemSettings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/paquetes" element={<Paquetes />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

          {/* Rutas admin (organization owner) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="team" element={<Team />} />
            <Route path="ia-settings" element={<IASettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Rutas super-admin */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SalesOverview />} />
            <Route path="clients" element={<ClientManagement />} />
            <Route path="plans" element={<PlanConfiguration />} />
            <Route path="ai-monitor" element={<AIChatbotMonitor />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          {/* Fallback routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
