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

// Admin - Material Categories
import { CategoryCatalog, CreateCategory } from "./modules/admin/modules/material-categories";

// Admin - Material Types
import { MaterialTypeCatalog, CreateMaterialType } from "./modules/admin/modules/material-types";

// Admin - Material Instances
import { MaterialInstanceCatalog, CreateMaterialInstance } from "./modules/admin/modules/material-instances";

// Super Admin — lazy-loaded for code-splitting
const SuperAdminLayout = lazy(() => import("./modules/super-admin/layouts/SuperAdminLayout"));
const SalesOverview = lazy(() => import("./modules/super-admin/pages/SalesOverview"));
const UserManagement = lazy(() => import("./modules/super-admin/pages/UserManagement"));
const SuperAdminSubscriptionManagement = lazy(() => import("./modules/super-admin/pages/SubscriptionManagement"));
const AIChatbotMonitor = lazy(() => import("./modules/super-admin/pages/AIChatbotMonitor"));
const SystemSettings = lazy(() => import("./modules/super-admin/pages/SystemSettings"));
const OrganizationManagement = lazy(() => import("./modules/super-admin/pages/OrganizationManagement"));

// Warehouse Operator — lazy-loaded for code-splitting
const WarehouseOperatorLayout = lazy(() => import("./modules/warehouse-operator/layouts/WarehouseOperatorLayout"));
const WarehouseOperatorDashboard = lazy(() => import("./modules/warehouse-operator/pages/Dashboard"));
const InventoryPage = lazy(() => import("./modules/warehouse-operator/pages/Inventory"));
const LocationsPage = lazy(() => import("./modules/warehouse-operator/pages/Locations"));
const StockMovementsPage = lazy(() => import("./modules/warehouse-operator/pages/StockMovements"));
const AlertsPage = lazy(() => import("./modules/warehouse-operator/pages/Alerts"));
const WarehouseOperatorSettings = lazy(() => import("./modules/warehouse-operator/pages/Settings"));

// Location Manager — lazy-loaded for code-splitting
const LocationManagerLayout = lazy(() => import("./modules/location-manager/layouts/LocationManagerLayout"));
const LocationManagerDashboard = lazy(() => import("./modules/location-manager/pages/Dashboard"));
const MaterialsPage = lazy(() => import("./modules/location-manager/pages/Materials"));
const CategoriesPage = lazy(() => import("./modules/location-manager/pages/Categories"));
const ModelsPage = lazy(() => import("./modules/location-manager/pages/Models"));
const AttributesPage = lazy(() => import("./modules/location-manager/pages/Attributes"));
const PlansPage = lazy(() => import("./modules/location-manager/pages/Plans"));
const LocationManagerSettings = lazy(() => import("./modules/location-manager/pages/Settings"));

// Commercial Advisor — lazy-loaded for code-splitting
const CommercialAdvisorLayout = lazy(() => import("./modules/commercial-advisor/layouts/CommercialAdvisorLayout"));
const CommercialAdvisorDashboard = lazy(() => import("./modules/commercial-advisor/pages/Dashboard"));
const CustomersPage = lazy(() => import("./modules/commercial-advisor/pages/Customers"));
const OrdersPage = lazy(() => import("./modules/commercial-advisor/pages/Orders"));
const ContractsPage = lazy(() => import("./modules/commercial-advisor/pages/Contracts"));
const RentalsPage = lazy(() => import("./modules/commercial-advisor/pages/Rentals"));
const InvoicesPage = lazy(() => import("./modules/commercial-advisor/pages/Invoices"));
const ReportsPage = lazy(() => import("./modules/commercial-advisor/pages/Reports"));
const CommercialAdvisorSettings = lazy(() => import("./modules/commercial-advisor/pages/Settings"));

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
            <Route path="material-categories" element={<CategoryCatalog />} />
            <Route path="material-categories/create" element={<CreateCategory />} />
            <Route path="material-types" element={<MaterialTypeCatalog />} />
            <Route path="material-types/create" element={<CreateMaterialType />} />
            <Route path="material-instances" element={<MaterialInstanceCatalog />} />
            <Route path="material-instances/create" element={<CreateMaterialInstance />} />
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

          {/* Rutas warehouse-operator - require warehouse_operator role */}
          <Route 
            path="/warehouse-operator" 
            element={
              <RequireRole allowedRoles={['warehouse_operator']}>
                <Suspense fallback={<LoadingSpinner />}>
                  <WarehouseOperatorLayout />
                </Suspense>
              </RequireRole>
            }
          >
            <Route index element={<WarehouseOperatorDashboard />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="stock-movements" element={<StockMovementsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="settings" element={<WarehouseOperatorSettings />} />
          </Route>

          {/* Rutas location-manager - require manager role */}
          <Route 
            path="/location-manager" 
            element={
              <RequireRole allowedRoles={['manager']}>
                <Suspense fallback={<LoadingSpinner />}>
                  <LocationManagerLayout />
                </Suspense>
              </RequireRole>
            }
          >
            <Route index element={<LocationManagerDashboard />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="attributes" element={<AttributesPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="settings" element={<LocationManagerSettings />} />
          </Route>

          {/* Rutas commercial-advisor - require commercial_advisor role */}
          <Route 
            path="/commercial-advisor" 
            element={
              <RequireRole allowedRoles={['commercial_advisor']}>
                <Suspense fallback={<LoadingSpinner />}>
                  <CommercialAdvisorLayout />
                </Suspense>
              </RequireRole>
            }
          >
            <Route index element={<CommercialAdvisorDashboard />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="rentals" element={<RentalsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<CommercialAdvisorSettings />} />
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
