import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireRole } from "./utils/roleGuard";
import { RequireActiveSubscription } from "./utils/subscriptionGuard";
import { LoadingSpinner } from "./components/ui";

// Public pages
import Dashboard from "./pages/Dashboard";
import Paquetes from "./pages/Packages";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AboutUs from "./pages/AboutUs";
import PasswordRecovery from "./pages/PasswordRecovery";
import AcceptInvite from "./pages/AcceptInvite";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";

// Fallback pages
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Demo / QA pages
import ExportDemo from "./pages/ExportDemo";

// Admin (organization owner)
import AdminLayout from "./modules/admin/layouts/AdminLayout";
import AdminDashboard from "./modules/admin/pages/AdminDashboard";
import MyEvents from "./modules/admin/pages/MyEvents";
import Customers from "./modules/admin/pages/Customers";
import Team from "./modules/admin/pages/Team";
import IASettings from "./modules/admin/pages/IA_Settings";
import Settings from "./modules/admin/pages/Settings";
import AdminSubscriptionManagement from "./modules/admin/pages/SubscriptionManagement";

// Super Admin — lazy-loaded for code-splitting
const SuperAdminLayout = lazy(() => import("./modules/super-admin/layouts/SuperAdminLayout"));
const SalesOverview = lazy(() => import("./modules/super-admin/pages/SalesOverview"));
const UserManagement = lazy(() => import("./modules/super-admin/pages/UserManagement"));
const SuperAdminSubscriptionManagement = lazy(() => import("./modules/super-admin/pages/SubscriptionManagement"));
const AIChatbotMonitor = lazy(() => import("./modules/super-admin/pages/AIChatbotMonitor"));
const SystemSettings = lazy(() => import("./modules/super-admin/pages/SystemSettings"));
const OrganizationManagement = lazy(() => import("./modules/super-admin/pages/OrganizationManagement"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/packages" element={<Paquetes />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/export-demo" element={<ExportDemo />} />

          {/* Rutas admin (organization owner) */}
          <Route
            path="/admin"
            element={
              <RequireActiveSubscription>
                <AdminLayout />
              </RequireActiveSubscription>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="customers" element={<Customers />} />
            <Route path="team" element={<Team />} />
            <Route path="ia-settings" element={<IASettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<AdminSubscriptionManagement />} />
          </Route>

          {/* Rutas super-admin - require super_admin role */}
          <Route 
            path="/super-admin" 
            element={
              <RequireRole allowedRoles={['super_admin']}>
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminLayout />
                </Suspense>
              </RequireRole>
            }
          >
            <Route index element={<SalesOverview />} />
            <Route path="clients" element={<UserManagement />} />
            <Route path="organizations" element={<OrganizationManagement />} />
            <Route path="subscriptions" element={<SuperAdminSubscriptionManagement />} />
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
