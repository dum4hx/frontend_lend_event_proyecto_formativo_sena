import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { RequirePermission } from "./utils/permissionGuard";
import { RequireActiveSubscription } from "./utils/subscriptionGuard";
import { LoadingSpinner } from "./components/ui";
import ScrollToTop from "./components/ScrollToTop";
import { usePermissions } from "./contexts/usePermissions";
import { getFirstAccessibleUrl } from "./utils/roleRouting";

// Public pages
import Dashboard from "./pages/Dashboard";
import Paquetes from "./pages/Packages";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PasswordRecovery from "./pages/PasswordRecovery";
import AcceptInvite from "./pages/AcceptInvite";
import EmailVerification from "./pages/EmailVerification";
import LoginOtp from "./pages/LoginOtp";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import {
  AboutPage,
  BillingPage,
  BlogPage,
  BookDemoPage,
  BusinessPage,
  CookiePolicyPage,
  ContactPage,
  HelpCenterPage,
  PricingPage,
  TermsOfServicePage,
  WhatsNewPage,
} from "./pages/footer";

// Fallback pages
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Demo / QA pages
import ExportDemo from "./pages/ExportDemo";

// Unified App module
import AppLayout from "./modules/app/layouts/AppLayout";
import AdminDashboard from "./modules/app/pages/AdminDashboard";

/**
 * Redirects the user to the first /app route they have access to.
 * Falls back to AdminDashboard if analytics:read is available,
 * otherwise picks the first permitted nav item.
 */
function AppIndexRedirect() {
  const { permissions } = usePermissions();
  const destination = getFirstAccessibleUrl(permissions);
  // If the resolved route is /app itself (dashboard), render it directly to
  // avoid an extra navigation loop.
  if (destination === "/app") {
    return <AdminDashboard />;
  }
  return <Navigate to={destination} replace />;
}
import Customers from "./modules/app/pages/Customers";
import Team from "./modules/app/pages/Team";
import Settings from "./modules/app/pages/Settings";
import SubscriptionManagement from "./modules/app/pages/SubscriptionManagement";
import RoleManagement from "./modules/app/pages/RoleManagement";
import Locations from "./modules/app/pages/Locations";
import Attributes from "./modules/app/pages/Attributes";
import Plans from "./modules/app/pages/Plans";
import Orders from "./modules/app/pages/Orders";
import Rentals from "./modules/app/pages/Rentals";
import Invoices from "./modules/app/pages/Invoices";
import PaymentMethods from "./modules/app/pages/PaymentMethods";
import CodeSchemes from "./modules/app/pages/code-schemes";
import Reports from "./modules/app/pages/Reports";
import PricingConfigs from "./modules/app/pages/PricingConfigs";

// App - Material sub-modules
import { CategoryCatalog, CreateCategory } from "./modules/app/modules/material-categories";
import { MaterialTypeCatalog, CreateMaterialType } from "./modules/app/modules/material-types";
import { MaterialInstanceCatalog } from "./modules/app/modules/material-instances";
import { InspectionsCatalog } from "./modules/app/modules/inspections";
import { IncidentsCatalog } from "./modules/app/modules/incidents";
import { MaintenanceCatalog, BatchRepairView } from "./modules/app/modules/maintenance";
import { CatalogOverview } from "./modules/app/modules/catalog-overview";
import TransferRequests from "./modules/app/pages/TransferRequests";
import OperationsDashboard from "./modules/app/pages/OperationsDashboard";

// Super Admin — lazy-loaded for code-splitting
const SuperAdminLayout = lazy(() => import("./modules/super-admin/layouts/SuperAdminLayout"));
const SalesOverview = lazy(() => import("./modules/super-admin/pages/SalesOverview"));
const UserManagement = lazy(() => import("./modules/super-admin/pages/UserManagement"));
const SuperAdminSubscriptionManagement = lazy(
  () => import("./modules/super-admin/pages/SubscriptionManagement"),
);
const SystemSettings = lazy(() => import("./modules/super-admin/pages/SystemSettings"));
const OrganizationManagement = lazy(
  () => import("./modules/super-admin/pages/OrganizationManagement"),
);
const AdminReports = lazy(() => import("./modules/super-admin/pages/AdminReports"));

/**
 * AppRoutes — Main routes component that must be inside AuthProvider.
 *
 * Permissions are kept in sync automatically:
 * - On login/logout (AuthContext handles this)
 * - On mutations (services invalidate/refresh as needed)
 * - No polling — only real changes sync
 */
function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/packages" element={<Paquetes />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/password-recovery" element={<PasswordRecovery />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/auth/verify-otp" element={<LoginOtp />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/export-demo" element={<ExportDemo />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/about-company" element={<Navigate to="/about" replace />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />
        <Route path="/whats-new" element={<WhatsNewPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />

        {/* Unified /app routes — visibility controlled by permissions */}
        <Route
          path="/app"
          element={
            <RequirePermission
              requiredPermissions={[
                "analytics:read",
                "organization:read",
                "materials:read",
                "customers:read",
                "loans:read",
                "requests:read",
              ]}
            >
              <RequireActiveSubscription>
                <AppLayout />
              </RequireActiveSubscription>
            </RequirePermission>
          }
        >
          <Route index element={<AppIndexRedirect />} />
          <Route path="customers" element={<Customers />} />
          <Route path="team" element={<Team />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="material-categories" element={<CategoryCatalog />} />
          <Route path="material-categories/create" element={<CreateCategory />} />
          <Route path="material-types" element={<MaterialTypeCatalog />} />
          <Route path="material-types/create" element={<CreateMaterialType />} />
          <Route path="material-instances" element={<MaterialInstanceCatalog />} />
          <Route path="inspections" element={<InspectionsCatalog />} />
          <Route path="incidents" element={<IncidentsCatalog />} />
          <Route path="maintenance" element={<MaintenanceCatalog />} />
          <Route path="maintenance/:batchId/repair" element={<BatchRepairView />} />
          <Route path="catalog-overview" element={<CatalogOverview />} />
          <Route path="transfer-requests" element={<TransferRequests />} />
          <Route path="operations" element={<OperationsDashboard />} />
          <Route path="attributes" element={<Attributes />} />
          <Route path="plans" element={<Plans />} />
          <Route path="locations" element={<Locations />} />
          <Route path="orders" element={<Orders />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="pricing" element={<PricingConfigs />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="settings/code-schemes" element={<CodeSchemes />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="subscription" element={<SubscriptionManagement />} />
        </Route>

        {/* Super Admin routes — require platform:manage permission */}
        <Route
          path="/super-admin"
          element={
            <RequirePermission requiredPermissions={["platform:manage"]}>
              <Suspense fallback={<LoadingSpinner />}>
                <SuperAdminLayout />
              </Suspense>
            </RequirePermission>
          }
        >
          <Route index element={<SalesOverview />} />
          <Route path="clients" element={<UserManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptionManagement />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        {/* Legacy redirects — old role-based URLs → unified /app */}
        <Route path="/admin/*" element={<Navigate to="/app" replace />} />
        <Route path="/warehouse-operator/*" element={<Navigate to="/app" replace />} />
        <Route path="/location-manager/*" element={<Navigate to="/app" replace />} />
        <Route path="/commercial-advisor/*" element={<Navigate to="/app" replace />} />

        {/* Fallback routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
