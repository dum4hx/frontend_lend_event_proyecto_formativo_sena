import { useMemo } from "react";
import { AlertTriangle, Users, Calendar, DollarSign, Clock, ShoppingCart, FileText, UserCircle, Package, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard, AdminTable } from "../components";
import { PageHeader } from "../../../components/ui";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useLanguage } from "../../../contexts/useLanguage";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const REQUEST_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  ready: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

const LOAN_BADGE: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  returned: "bg-gray-500/20 text-gray-400",
  closed: "bg-gray-600/20 text-gray-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { language, locale } = useLanguage();
  const isEs = language === "es";
  const { stats, loading, error, refetch } = useDashboardStats();

  const invoiceTotal =
    (stats?.paidInvoicesTotal ?? 0) + (stats?.pendingInvoicesTotal ?? 0);
  const paidPct =
    invoiceTotal > 0
      ? Math.round(((stats?.paidInvoicesTotal ?? 0) / invoiceTotal) * 100)
      : 0;

  // fetchedAt is captured in the hook (inside useCallback), not during render
  const overdueWithDays = useMemo(() => {
    const now = stats?.fetchedAt ?? 0;
    return (stats?.recentOverdueLoans ?? []).map((loan) => ({
      ...loan,
      daysLate: Math.max(
        0,
        Math.floor((now - new Date(loan.endDate).getTime()) / 86_400_000),
      ),
    }));
  }, [stats?.recentOverdueLoans, stats?.fetchedAt]);

  return (
    <div className="page-container">
      <PageHeader
        title={isEs ? "Panel" : "Dashboard"}
        subtitle={
          error
            ? isEs
              ? "Hubo un problema al cargar los datos"
              : "There was a problem loading the data"
            : isEs
              ? "Bienvenido de nuevo. Aqui tienes tu resumen"
              : "Welcome back! Here's your overview"
        }
      />

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={refetch}
            className="border border-red-400 px-3 py-1 rounded-lg hover:bg-red-400/10 transition-colors text-xs font-medium"
          >
            {isEs ? "Reintentar" : "Retry"}
          </button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label={isEs ? "Usuarios totales" : "Total Users"}
          value={loading ? "—" : fmt(stats?.totalUsers ?? 0)}
          icon={<Users size={28} />}
        />
        <StatCard
          label={isEs ? "Prestamos activos" : "Active Loans"}
          value={loading ? "—" : fmt(stats?.activeLoans ?? 0)}
          icon={<Calendar size={28} />}
        />
        <StatCard
          label={isEs ? "Prestamos vencidos" : "Overdue Loans"}
          value={loading ? "—" : fmt(stats?.overdueLoans ?? 0)}
          icon={<Clock size={28} />}
          trend={
            !loading && (stats?.overdueLoans ?? 0) > 0
              ? isEs
                ? `${stats!.overdueLoans} vencidos`
                : `${stats!.overdueLoans} overdue`
              : undefined
          }
          trendUp={false}
        />
        <StatCard
          label={isEs ? "Pagado en el periodo" : "Paid This Period"}
          value={loading ? "—" : `$${fmt(stats?.paidInvoicesTotal ?? 0)}`}
          icon={<DollarSign size={28} />}
          trend={
            !loading && (stats?.pendingInvoicesCount ?? 0) > 0
              ? isEs
                ? `${stats!.pendingInvoicesCount} pendientes`
                : `${stats!.pendingInvoicesCount} pending`
              : undefined
          }
          trendUp={false}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Pending Requests (2/3) ── */}
        <div className="xl:col-span-2 bg-[#121212] border border-[#333] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-base">{isEs ? "Solicitudes pendientes" : "Pending Requests"}</h2>
            <Link
              to="/app/orders"
              className="text-xs text-[#FFD700] hover:underline flex items-center gap-1"
            >
              {isEs ? "Ver todo" : "View all"} <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
              ))}
            </div>
          ) : (stats?.recentRequests ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
              <CheckCircle2 size={32} className="text-green-500/40" />
              <p className="text-sm">{isEs ? "No hay solicitudes pendientes" : "No pending requests"}</p>
            </div>
          ) : (
            <AdminTable>
              <thead>
                <tr className="border-b border-[#333] text-gray-400 text-xs uppercase">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">{isEs ? "Items" : "Items"}</th>
                  <th className="px-4 py-3 font-medium">{isEs ? "Inicio" : "Start"}</th>
                  <th className="px-4 py-3 font-medium">{isEs ? "Fin" : "End"}</th>
                  <th className="px-4 py-3 font-medium">{isEs ? "Estado" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {stats!.recentRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors text-sm"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      <Link to="/app/orders" className="entity-link">
                        {shortId(req._id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {req.items.length} {isEs ? (req.items.length !== 1 ? "items" : "item") : `item${req.items.length !== 1 ? "s" : ""}`}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(req.startDate, locale)}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(req.endDate, locale)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${REQUEST_BADGE[req.status] ?? "bg-gray-500/20 text-gray-400"}`}
                      >
                        {isEs
                          ? req.status === "pending"
                            ? "pendiente"
                            : req.status === "approved"
                              ? "aprobado"
                              : req.status === "rejected"
                                ? "rechazado"
                                : req.status === "ready"
                                  ? "listo"
                                  : "cancelado"
                          : req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">

          {/* ── Invoice Summary ── */}
          <div className="bg-[#121212] border border-[#333] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-base">{isEs ? "Resumen de facturas" : "Invoice Summary"}</h2>
              <Link
                to="/app/invoices"
                className="text-xs text-[#FFD700] hover:underline flex items-center gap-1"
              >
                {isEs ? "Ver todo" : "View all"} <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-8 bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-2/3" />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{isEs ? "Pagado" : "Paid"}</span>
                    <span className="text-green-400 font-medium">
                      ${fmt(stats?.paidInvoicesTotal ?? 0)}
                    </span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-2 border border-[#333]">
                    <div
                      className="bg-[#FFD700] h-full rounded-full transition-all duration-500"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{isEs ? "Pendiente" : "Pending"} ({stats?.pendingInvoicesCount ?? 0})</span>
                    <span className="text-yellow-400 font-medium">
                      ${fmt(stats?.pendingInvoicesTotal ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="text-center text-2xl font-bold text-white pt-1">
                  {paidPct}%
                  <span className="text-xs font-normal text-gray-400 ml-1">{isEs ? "recaudado" : "collected"}</span>
                </div>
              </>
            )}
          </div>

          {/* ── Quick Actions ── */}
          <div className="bg-[#121212] border border-[#333] rounded-xl p-5 space-y-3">
            <h2 className="text-white font-semibold text-base">{isEs ? "Acciones rapidas" : "Quick Actions"}</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: isEs ? "Pedidos" : "Orders", to: "/app/orders", icon: <ShoppingCart size={16} /> },
                { label: isEs ? "Alquileres" : "Rentals", to: "/app/rentals", icon: <Package size={16} /> },
                { label: isEs ? "Clientes" : "Customers", to: "/app/customers", icon: <UserCircle size={16} /> },
                { label: isEs ? "Facturas" : "Invoices", to: "/app/invoices", icon: <FileText size={16} /> },
              ].map(({ label, to, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] hover:border-[#FFD700] text-gray-300 hover:text-[#FFD700] rounded-lg px-3 py-2.5 text-sm transition-all"
                >
                  {icon}
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overdue Loans panel (conditional) ── */}
      {!loading && overdueWithDays.length > 0 && (
        <div className="bg-[#121212] border border-red-500/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={18} />
              <h2 className="font-semibold text-base">{isEs ? "Prestamos vencidos" : "Overdue Loans"}</h2>
            </div>
            <Link
              to="/app/rentals"
              className="text-xs text-red-400 hover:underline flex items-center gap-1"
            >
              {isEs ? "Ver todo" : "View all"} <ArrowRight size={12} />
            </Link>
          </div>
          <AdminTable>
            <thead>
              <tr className="border-b border-[#333] text-gray-400 text-xs uppercase">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">{isEs ? "Fecha limite" : "Due Date"}</th>
                <th className="px-4 py-3 font-medium">{isEs ? "Dias tarde" : "Days Late"}</th>
                <th className="px-4 py-3 font-medium">{isEs ? "Estado" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {overdueWithDays.map((loan) => (
                <tr
                  key={loan._id}
                  className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors text-sm"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    <Link to="/app/rentals" className="entity-link">
                      {shortId(loan._id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(loan.endDate, locale)}</td>
                  <td className="px-4 py-3 text-red-400 font-medium">
                    {loan.daysLate} {isEs ? "dias" : "d"} {isEs ? "tarde" : "late"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${LOAN_BADGE[loan.status] ?? "bg-gray-500/20 text-gray-400"}`}
                    >
                      {isEs
                        ? loan.status === "active"
                          ? "activo"
                          : loan.status === "overdue"
                            ? "vencido"
                            : loan.status === "returned"
                              ? "devuelto"
                              : "cerrado"
                        : loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      )}
    </div>
  );
}
