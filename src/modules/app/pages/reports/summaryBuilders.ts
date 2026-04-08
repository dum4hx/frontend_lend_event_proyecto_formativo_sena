/**
 * Maps typed API summary objects to flat SummaryEntry[] arrays
 * for inclusion in CSV, PDF, and XLSX exports.
 */

import type { SummaryEntry } from "./helpers";
import type {
  ExportLoanActivitySummary,
  ExportSalesSummary,
  ExportInventorySummary,
  ExportDamagesSummary,
  ExportTransfersSummary,
} from "../../../../types/api";

type T = (key: string) => string;
type FmtCurrency = (val: number, currency: string) => string;

const pct = (val: number): string => `${(val * 100).toFixed(1)}%`;

// ─── Loans ─────────────────────────────────────────────────────────────────

export function buildLoanSummaryEntries(
  summary: ExportLoanActivitySummary,
  t: T,
  formatCurrency: FmtCurrency,
): SummaryEntry[] {
  const entries: SummaryEntry[] = [
    { label: t("reports.kpi.totalLoans"), value: summary.totalLoans },
    { label: t("reports.kpi.totalRevenue"), value: formatCurrency(summary.totalRevenue, "COP") },
    { label: t("reports.kpi.avgDuration"), value: summary.averageDurationDays },
    { label: t("reports.kpi.overdueRate"), value: pct(summary.overdueRate) },
    { label: t("reports.kpi.returnRate"), value: pct(summary.returnRate) },
  ];

  if (summary.loansByStatus.length > 0) {
    entries.push({ label: `— ${t("reports.summary.loansByStatus")} —`, value: "" });
    for (const s of summary.loansByStatus) {
      entries.push({ label: `  ${s.status}`, value: `${s.count} (${formatCurrency(s.totalAmount, "COP")})` });
    }
  }

  if (summary.topCustomers.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topCustomers")} —`, value: "" });
    for (const c of summary.topCustomers) {
      entries.push({ label: `  ${c.customerName}`, value: `${c.loanCount} (${formatCurrency(c.totalAmount, "COP")})` });
    }
  }

  if (summary.topMaterials.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topMaterials")} —`, value: "" });
    for (const m of summary.topMaterials) {
      entries.push({ label: `  ${m.materialName}`, value: m.loanCount });
    }
  }

  if (summary.periodComparison) {
    const pc = summary.periodComparison;
    entries.push({ label: `— ${t("reports.summary.periodComparison")} —`, value: "" });
    entries.push({ label: `  ${t("reports.summary.currentPeriod")}`, value: `${pc.currentCount} (${formatCurrency(pc.currentRevenue, "COP")})` });
    entries.push({ label: `  ${t("reports.summary.previousPeriod")}`, value: `${pc.previousCount} (${formatCurrency(pc.previousRevenue, "COP")})` });
    entries.push({ label: `  ${t("reports.summary.change")}`, value: `${pc.percentChange > 0 ? "+" : ""}${pc.percentChange.toFixed(1)}%` });
  }

  return entries;
}

// ─── Financial (Sales) ─────────────────────────────────────────────────────

export function buildSalesSummaryEntries(
  summary: ExportSalesSummary,
  t: T,
  formatCurrency: FmtCurrency,
): SummaryEntry[] {
  const entries: SummaryEntry[] = [
    { label: t("reports.kpi.combinedRevenue"), value: formatCurrency(summary.combinedRevenue, "COP") },
    { label: t("reports.kpi.loanRevenue"), value: formatCurrency(summary.totalLoanRevenue, "COP") },
    { label: t("reports.kpi.invoiceRevenue"), value: formatCurrency(summary.totalInvoiceRevenue, "COP") },
    { label: t("reports.kpi.averageLoanValue"), value: formatCurrency(summary.averageLoanValue, "COP") },
  ];

  if (summary.revenueByInvoiceType.length > 0) {
    entries.push({ label: `— ${t("reports.summary.revenueByType")} —`, value: "" });
    for (const r of summary.revenueByInvoiceType) {
      entries.push({ label: `  ${r.type}`, value: `${r.count} (${formatCurrency(r.revenue, "COP")})` });
    }
  }

  if (summary.topCustomersByRevenue.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topCustomersByRevenue")} —`, value: "" });
    for (const c of summary.topCustomersByRevenue) {
      entries.push({ label: `  ${c.customerName}`, value: formatCurrency(c.totalRevenue, "COP") });
    }
  }

  if (summary.periodComparison) {
    const pc = summary.periodComparison;
    entries.push({ label: `— ${t("reports.summary.periodComparison")} —`, value: "" });
    entries.push({ label: `  ${t("reports.summary.currentPeriod")}`, value: formatCurrency(pc.currentTotal, "COP") });
    entries.push({ label: `  ${t("reports.summary.previousPeriod")}`, value: formatCurrency(pc.previousTotal, "COP") });
    entries.push({ label: `  ${t("reports.summary.change")}`, value: `${pc.percentChange > 0 ? "+" : ""}${pc.percentChange.toFixed(1)}%` });
  }

  return entries;
}

// ─── Inventory ─────────────────────────────────────────────────────────────

export function buildInventorySummaryEntries(
  summary: ExportInventorySummary,
  t: T,
  formatCurrency: FmtCurrency,
): SummaryEntry[] {
  const entries: SummaryEntry[] = [
    { label: t("reports.kpi.totalTypes"), value: summary.totalMaterialTypes },
    { label: t("reports.kpi.totalInstances"), value: summary.totalInstances },
    { label: t("reports.kpi.totalLocations"), value: summary.totalLocations },
    { label: t("reports.kpi.availabilityRate"), value: pct(summary.globalAvailabilityRate) },
    { label: t("reports.kpi.utilizationRate"), value: pct(summary.globalUtilizationRate) },
    { label: t("reports.kpi.damageRate"), value: pct(summary.damageRate) },
    { label: t("reports.kpi.maintenanceRate"), value: pct(summary.maintenanceRate) },
    { label: t("reports.kpi.estimatedDailyValue"), value: formatCurrency(summary.estimatedDailyValue, "COP") },
  ];

  if (summary.topMaterialTypesByStock.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topMaterialsByStock")} —`, value: "" });
    for (const m of summary.topMaterialTypesByStock) {
      entries.push({ label: `  ${m.name}`, value: m.total });
    }
  }

  if (summary.topLocationsByStock.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topLocationsByStock")} —`, value: "" });
    for (const l of summary.topLocationsByStock) {
      entries.push({ label: `  ${l.name}`, value: l.total });
    }
  }

  return entries;
}

// ─── Damages ───────────────────────────────────────────────────────────────

export function buildDamagesSummaryEntries(
  summary: ExportDamagesSummary,
  t: T,
  formatCurrency: FmtCurrency,
): SummaryEntry[] {
  const entries: SummaryEntry[] = [
    { label: t("reports.kpi.totalBatches"), value: summary.totalBatches },
    { label: t("reports.kpi.totalItems"), value: summary.totalItems },
    { label: t("reports.kpi.totalEstimatedCost"), value: formatCurrency(summary.totalEstimatedCost, "COP") },
    { label: t("reports.kpi.totalActualCost"), value: formatCurrency(summary.totalActualCost, "COP") },
    { label: t("reports.kpi.costVariance"), value: formatCurrency(summary.costVariance, "COP") },
    { label: t("reports.kpi.costVariancePercent"), value: `${summary.costVariancePercent.toFixed(1)}%` },
    { label: t("reports.kpi.avgRepairTime"), value: summary.averageRepairTimeDays },
  ];

  if (summary.costByEntryReason.length > 0) {
    entries.push({ label: `— ${t("reports.summary.costByEntryReason")} —`, value: "" });
    for (const r of summary.costByEntryReason) {
      entries.push({ label: `  ${r.reason}`, value: `${r.itemCount} (${formatCurrency(r.actualCost, "COP")})` });
    }
  }

  if (summary.mostDamagedMaterials.length > 0) {
    entries.push({ label: `— ${t("reports.summary.mostDamagedMaterials")} —`, value: "" });
    for (const m of summary.mostDamagedMaterials) {
      entries.push({ label: `  ${m.materialTypeName}`, value: `${m.incidentCount} (${formatCurrency(m.totalCost, "COP")})` });
    }
  }

  if (summary.resolutionBreakdown.length > 0) {
    entries.push({ label: `— ${t("reports.summary.resolutionBreakdown")} —`, value: "" });
    for (const s of summary.resolutionBreakdown) {
      entries.push({ label: `  ${s.status}`, value: s.count });
    }
  }

  if (summary.periodComparison) {
    const pc = summary.periodComparison;
    entries.push({ label: `— ${t("reports.summary.periodComparison")} —`, value: "" });
    entries.push({ label: `  ${t("reports.summary.currentPeriod")}`, value: formatCurrency(pc.currentCost, "COP") });
    entries.push({ label: `  ${t("reports.summary.previousPeriod")}`, value: formatCurrency(pc.previousCost, "COP") });
    entries.push({ label: `  ${t("reports.summary.change")}`, value: `${pc.percentChange > 0 ? "+" : ""}${pc.percentChange.toFixed(1)}%` });
  }

  return entries;
}

// ─── Transfers ─────────────────────────────────────────────────────────────

export function buildTransfersSummaryEntries(
  summary: ExportTransfersSummary,
  t: T,
  formatCurrency: FmtCurrency,
): SummaryEntry[] {
  void formatCurrency; // not used for transfers but keeps signature consistent
  const entries: SummaryEntry[] = [
    { label: t("reports.kpi.totalTransfers"), value: summary.totalTransfers },
    { label: t("reports.kpi.totalItemsMoved"), value: summary.totalItemsMoved },
    { label: t("reports.kpi.avgTransitDays"), value: summary.averageTransitDays },
    { label: t("reports.kpi.completionRate"), value: pct(summary.completionRate) },
    { label: t("reports.kpi.issueRate"), value: pct(summary.issueRate) },
  ];

  if (summary.transfersByStatus.length > 0) {
    entries.push({ label: `— ${t("reports.summary.transfersByStatus")} —`, value: "" });
    for (const s of summary.transfersByStatus) {
      entries.push({ label: `  ${s.status}`, value: `${s.count} (${s.totalItems} items)` });
    }
  }

  if (summary.topRoutes.length > 0) {
    entries.push({ label: `— ${t("reports.summary.topRoutes")} —`, value: "" });
    for (const r of summary.topRoutes) {
      entries.push({ label: `  ${r.fromLocation} → ${r.toLocation}`, value: `${r.transferCount} (${r.totalItems} items)` });
    }
  }

  if (summary.receivedConditionBreakdown.length > 0) {
    entries.push({ label: `— ${t("reports.summary.conditionBreakdown")} —`, value: "" });
    for (const c of summary.receivedConditionBreakdown) {
      entries.push({ label: `  ${c.condition}`, value: c.count });
    }
  }

  if (summary.periodComparison) {
    const pc = summary.periodComparison;
    entries.push({ label: `— ${t("reports.summary.periodComparison")} —`, value: "" });
    entries.push({ label: `  ${t("reports.summary.currentPeriod")}`, value: pc.currentTransfers });
    entries.push({ label: `  ${t("reports.summary.previousPeriod")}`, value: pc.previousTransfers });
    entries.push({ label: `  ${t("reports.summary.change")}`, value: `${pc.percentChange > 0 ? "+" : ""}${pc.percentChange.toFixed(1)}%` });
  }

  return entries;
}
