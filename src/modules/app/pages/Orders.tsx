import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Search,
  ChevronDown,
  Check,
  X,
  Truck,
  CircleCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import type {
  Customer,
  CreateLoanRequestPayload,
  Loan,
  LoanRequest,
  LoanRequestItem,
  MaterialCategory,
  MaterialType,
  Package,
} from "../../../types/api";
import {
  createRequest,
  getLoans,
  getRequests,
  approveRequest,
  rejectRequest,
  createLoanFromRequest,
  returnLoan,
} from "../../../services/loanService";
import { getCustomers } from "../../../services/customerService";
import { getMaterialCategories, getMaterialTypes, getPackages } from "../../../services/materialService";
import { useAlertModal } from "../../../hooks/useAlertModal";

type WorkflowStatus =
  | "order_created"
  | "order_approved"
  | "order_shipped"
  | "order_in_use"
  | "order_completed"
  | "order_rejected"
  | "order_cancelled";

type WorkflowFilter = "all" | WorkflowStatus;

type FormDraftItem = {
  localId: string;
  categoryId: string;
  materialTypeId: string;
  quantity: string;
};

type OrderView = {
  request: LoanRequest;
  loan?: Loan;
  workflowStatus: WorkflowStatus;
  workflowLabel: string;
  customerName: string;
  itemCount: number;
  displayItems: string[];
};

const WORKFLOW_STEPS: Array<{ status: WorkflowStatus; label: string }> = [
  { status: "order_created", label: "Order Created" },
  { status: "order_approved", label: "Order Approved" },
  { status: "order_shipped", label: "Order Shipped" },
  { status: "order_in_use", label: "Order In Use / Loaned" },
  { status: "order_completed", label: "Order Completed / Delivered" },
];

const FILTER_OPTIONS: Array<{ value: WorkflowFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "order_created", label: "Order Created" },
  { value: "order_approved", label: "Order Approved" },
  { value: "order_shipped", label: "Order Shipped" },
  { value: "order_in_use", label: "Order In Use / Loaned" },
  { value: "order_completed", label: "Order Completed / Delivered" },
  { value: "order_rejected", label: "Rejected" },
  { value: "order_cancelled", label: "Cancelled" },
];

const EMPTY_FORM = {
  customerId: "",
  startDate: "",
  endDate: "",
  notes: "",
};

function formatDate(dateValue: string): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString();
}

function formatCustomerName(customer: Customer): string {
  return `${customer.name.firstName} ${customer.name.firstSurname}`.trim();
}

function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toSafeStartDateIso(dateOnly: string): string {
  const today = getTodayLocalDateString();
  if (dateOnly === today) {
    // If start date is today, send a timestamp slightly in the future.
    const nearFuture = new Date(Date.now() + 5 * 60 * 1000);
    return nearFuture.toISOString();
  }

  const localStart = new Date(`${dateOnly}T09:00:00`);
  return localStart.toISOString();
}

function toSafeEndDateIso(dateOnly: string): string {
  const localEnd = new Date(`${dateOnly}T23:59:59`);
  return localEnd.toISOString();
}

function formatMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function extractCategoryId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return (first as { _id?: string })._id;
  }
  if (value && typeof value === "object") return (value as { _id?: string })._id;
  return undefined;
}

function getWorkflowFromRequestAndLoan(request: LoanRequest, loan?: Loan): {
  status: WorkflowStatus;
  label: string;
} {
  if (request.status === "rejected") {
    return { status: "order_rejected", label: "Rejected" };
  }
  if (request.status === "cancelled") {
    return { status: "order_cancelled", label: "Cancelled" };
  }

  if (loan) {
    if (loan.status === "returned" || loan.status === "closed") {
      return { status: "order_completed", label: "Order Completed / Delivered" };
    }
    if (loan.status === "active" || loan.status === "overdue") {
      return { status: "order_in_use", label: "Order In Use / Loaned" };
    }
  }

  if (request.status === "ready") {
    return { status: "order_shipped", label: "Order Shipped" };
  }
  if (request.status === "approved") {
    return { status: "order_approved", label: "Order Approved" };
  }

  return { status: "order_created", label: "Order Created" };
}

function getStatusBadgeStyle(status: WorkflowStatus): string {
  switch (status) {
    case "order_completed":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "order_in_use":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "order_shipped":
      return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
    case "order_approved":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "order_created":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "order_rejected":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "order_cancelled":
      return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

function getStepIndex(status: WorkflowStatus): number {
  if (status === "order_rejected" || status === "order_cancelled") return 0;
  return WORKFLOW_STEPS.findIndex((step) => step.status === status);
}

function findRelatedLoan(requestId: string, loans: Loan[]): Loan | undefined {
  return loans.find((loan) => loan.requestId === requestId);
}

function mapRequestItemsToDisplay(
  items: LoanRequestItem[],
  packages: Package[],
  materialTypes: MaterialType[],
): string[] {
  return items.map((item) => {
    const quantity = item.quantity ?? 1;
    const packageRefId = item.packageId ?? (item.type === "package" ? item.referenceId : undefined);
    const materialRefId =
      item.materialTypeId ?? (item.type === "material" ? item.referenceId : undefined);

    if (packageRefId) {
      const packageName = packages.find((pkg) => pkg._id === packageRefId)?.name;
      return `${quantity}x ${packageName ?? "Package"} (Service Package)`;
    }

    if (materialRefId) {
      const materialName = materialTypes.find((material) => material._id === materialRefId)?.name;
      return `${quantity}x ${materialName ?? "Material"}`;
    }

    return `${quantity}x Unspecified item`;
  });
}

function buildOrderViewModel(
  requests: LoanRequest[],
  loans: Loan[],
  customers: Customer[],
  packages: Package[],
  materialTypes: MaterialType[],
): OrderView[] {
  return requests.map((request) => {
    const relatedLoan = findRelatedLoan(request._id, loans);
    const workflow = getWorkflowFromRequestAndLoan(request, relatedLoan);
    const customer = customers.find((entry) => entry._id === request.customerId);

    return {
      request,
      loan: relatedLoan,
      workflowStatus: workflow.status,
      workflowLabel: workflow.label,
      customerName: customer ? formatCustomerName(customer) : "Unknown customer",
      itemCount: request.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      displayItems: mapRequestItemsToDisplay(request.items, packages, materialTypes),
    };
  });
}

export default function Orders() {
  const navigate = useNavigate();
  const { showError, showSuccess, AlertModal } = useAlertModal();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<WorkflowFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderView | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrderView | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formItems, setFormItems] = useState<FormDraftItem[]>([
    { localId: crypto.randomUUID(), categoryId: "", materialTypeId: "", quantity: "1" },
  ]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, loansRes, customersRes, categoriesRes, packagesRes, materialTypesRes] =
        await Promise.allSettled([
        getRequests(),
        getLoans(),
        getCustomers({ page: 1, limit: 50 }),
        getMaterialCategories(),
        getPackages({ page: 1, limit: 100 }),
        getMaterialTypes(),
      ]);

      let requestsFailed = requestsRes.status === "rejected";
      let loansFailed = loansRes.status === "rejected";
      let customersFailed = customersRes.status === "rejected";
      const categoriesFailed = categoriesRes.status === "rejected";
      const packagesFailed = packagesRes.status === "rejected";
      const materialTypesFailed = materialTypesRes.status === "rejected";

      if (requestsRes.status === "fulfilled") {
        setRequests(requestsRes.value.data.requests ?? []);
      } else {
        // Fallback: some environments reject unpaginated list requests.
        try {
          const requestsFallbackRes = await getRequests({ page: 1, limit: 50 });
          setRequests(requestsFallbackRes.data.requests ?? []);
          requestsFailed = false;
        } catch {
          // Keep previous requests state if fallback also fails.
        }
      }
      if (loansRes.status === "fulfilled") {
        setLoans(loansRes.value.data.loans ?? []);
      } else {
        // Fallback: retry with explicit pagination.
        try {
          const loansFallbackRes = await getLoans({ page: 1, limit: 50 });
          setLoans(loansFallbackRes.data.loans ?? []);
          loansFailed = false;
        } catch {
          // Keep previous loans state if fallback also fails.
        }
      }
      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value.data.customers ?? []);
      } else {
        // Fallback: some backends reject bigger limits or optional params.
        try {
          const customersFallbackRes = await getCustomers({ page: 1, limit: 10 });
          setCustomers(customersFallbackRes.data.customers ?? []);
          customersFailed = false;
        } catch {
          // Keep previous customers state if fallback also fails.
        }
      }
      if (categoriesRes.status === "fulfilled") {
        setMaterialCategories(categoriesRes.value.data.categories ?? []);
      }
      if (packagesRes.status === "fulfilled") {
        setPackages(packagesRes.value.data.packages ?? []);
      }
      if (materialTypesRes.status === "fulfilled") {
        setMaterialTypes(materialTypesRes.value.data.materialTypes ?? []);
      }

      const failures: Array<{ source: string; reason: unknown }> = [];
      if (requestsFailed) failures.push({ source: "orders", reason: requestsRes.status === "rejected" ? requestsRes.reason : null });
      if (loansFailed) failures.push({ source: "loans", reason: loansRes.status === "rejected" ? loansRes.reason : null });
      if (customersFailed) failures.push({ source: "customers", reason: customersRes.status === "rejected" ? customersRes.reason : null });
      if (categoriesFailed) failures.push({ source: "categories", reason: categoriesRes.status === "rejected" ? categoriesRes.reason : null });
      if (packagesFailed) failures.push({ source: "packages", reason: packagesRes.status === "rejected" ? packagesRes.reason : null });
      if (materialTypesFailed) failures.push({ source: "material types", reason: materialTypesRes.status === "rejected" ? materialTypesRes.reason : null });

      if (failures.length > 0) {
        const firstFailure = failures[0];
        const reasonMessage =
          firstFailure.reason instanceof Error
            ? firstFailure.reason.message
            : "Request failed";
        setLoadWarning(
          `Some data could not be loaded: ${failures.map((entry) => entry.source).join(", ")}. ${reasonMessage}`,
        );
      } else {
        setLoadWarning("");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load orders";
      setLoadWarning(`Orders view could not load completely: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const allOrders = useMemo(
    () => buildOrderViewModel(requests, loans, customers, packages, materialTypes),
    [requests, loans, customers, packages, materialTypes],
  );

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        order.request._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || order.workflowStatus === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allOrders, searchTerm, selectedStatus]);

  const hasCustomers = customers.length > 0;
  const hasSelectableItems = materialTypes.length > 0;
  const todayDate = getTodayLocalDateString();

  const selectedDraftById = useMemo(() => {
    const details = new Map<
      string,
      {
        name?: string;
        description?: string;
        unitPrice?: number;
        quantity: number;
        includes: string[];
      }
    >();

    formItems.forEach((item) => {
      const quantity = Number(item.quantity);
      const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

      const selectedMaterial = materialTypes.find((material) => material._id === item.materialTypeId);
      const selectedCategory = materialCategories.find((category) => category._id === item.categoryId);

      details.set(item.localId, {
        name: selectedMaterial?.name,
        description: selectedMaterial?.description,
        unitPrice: selectedMaterial?.pricePerDay,
        quantity: normalizedQuantity,
        includes: selectedCategory ? [selectedCategory.name] : [],
      });
    });

    return details;
  }, [formItems, materialCategories, materialTypes]);

  const selectedDraftRows = useMemo(
    () =>
      formItems
        .map((item) => ({
          item,
          detail: selectedDraftById.get(item.localId),
        }))
        .filter(({ item, detail }) => Boolean(item.materialTypeId && detail?.name)),
    [formItems, selectedDraftById],
  );

  const estimatedDailyTotal = useMemo(
    () =>
      selectedDraftRows.reduce((sum, row) => {
        const unitPrice = row.detail?.unitPrice ?? 0;
        const quantity = row.detail?.quantity ?? 1;
        return sum + unitPrice * quantity;
      }, 0),
    [selectedDraftRows],
  );

  const resetCreateForm = () => {
    setFormData(EMPTY_FORM);
    setFormItems([{ localId: crypto.randomUUID(), categoryId: "", materialTypeId: "", quantity: "1" }]);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleAddDraftItem = () => {
    setFormItems((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), categoryId: "", materialTypeId: "", quantity: "1" },
    ]);
  };

  const handleDraftItemChange = (
    localId: string,
    updates: Partial<Pick<FormDraftItem, "categoryId" | "materialTypeId" | "quantity">>,
  ) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.localId !== localId) return item;
        if (typeof updates.categoryId === "string" && updates.categoryId !== item.categoryId) {
          return { ...item, categoryId: updates.categoryId, materialTypeId: "" };
        }
        return { ...item, ...updates };
      }),
    );
  };

  const handleDraftItemRemove = (localId: string) => {
    setFormItems((prev) => {
      const next = prev.filter((item) => item.localId !== localId);
      return next.length
        ? next
        : [{ localId: crypto.randomUUID(), categoryId: "", materialTypeId: "", quantity: "1" }];
    });
  };

  const handleCreateOrder = async () => {
    if (!formData.customerId || !formData.startDate || !formData.endDate) {
      showError("Customer and date range are required.", "Validation Error");
      return;
    }

    if (formData.startDate < todayDate) {
      showError("Start date cannot be in the past.", "Validation Error");
      return;
    }

    const parsedItems: LoanRequestItem[] = formItems
      .filter((item) => item.materialTypeId)
      .map((item) => {
        const quantity = Number(item.quantity);
        const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        return {
          type: "material",
          referenceId: item.materialTypeId,
          quantity: normalizedQuantity,
        };
      });

    if (parsedItems.length === 0) {
      showError("Add at least one product or service.", "Validation Error");
      return;
    }

    if (formData.endDate < formData.startDate) {
      showError("End date must be on or after start date.", "Validation Error");
      return;
    }

    const payload: CreateLoanRequestPayload = {
      customerId: formData.customerId,
      items: parsedItems,
      startDate: toSafeStartDateIso(formData.startDate),
      endDate: toSafeEndDateIso(formData.endDate),
      notes: formData.notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const createResponse = await createRequest(payload);
      const createdRequest = createResponse.data.request;
      if (createdRequest) {
        setRequests((prev) => {
          const exists = prev.some((entry) => entry._id === createdRequest._id);
          return exists ? prev : [createdRequest, ...prev];
        });
      }
      showSuccess("Order created successfully.", "Order Registered");
      closeCreateModal();
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create order";
      showError(message, "Order Creation Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveOrder = async (requestId: string) => {
    setSubmitting(true);
    try {
      await approveRequest(requestId, "Approved from Orders module");
      showSuccess("Order approved.", "Order Updated");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve order";
      showError(message, "Approval Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = (order: OrderView) => {
    setRejectTarget(order);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectOrder = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showError("Rejection reason is required.", "Validation Error");
      return;
    }

    setSubmitting(true);
    try {
      await rejectRequest(rejectTarget.request._id, rejectReason.trim());
      showSuccess("Order rejected.", "Order Updated");
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject order";
      showError(message, "Rejection Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartLoan = async (requestId: string) => {
    setSubmitting(true);
    try {
      await createLoanFromRequest(requestId);
      showSuccess("Loan started successfully.", "Loan Created");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start loan";
      showError(message, "Loan Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteLoan = async (loanId: string) => {
    setSubmitting(true);
    try {
      await returnLoan(loanId);
      showSuccess("Order marked as completed.", "Loan Returned");
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete loan";
      showError(message, "Completion Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Create, approve, and track order lifecycle from one place</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      {loadWarning && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {loadWarning}
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by request ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as WorkflowFilter)}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            {FILTER_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
        </div>
      </div>

      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#121212] border-b border-[#333]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Request ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date Range</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Products / Services</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Loading orders...
                    </span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.request._id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all">
                    <td className="px-6 py-4 text-white font-semibold">{order.request._id}</td>
                    <td className="px-6 py-4 text-gray-300">{order.customerName}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(order.request.startDate)} to {formatDate(order.request.endDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-xs font-semibold mr-2">
                        {order.itemCount}
                      </span>
                      items
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.workflowStatus)}`}>
                        {order.workflowLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all"
                          title="View details"
                          type="button"
                          onClick={() => {
                            setActiveOrder(order);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye size={18} />
                        </button>

                        {order.request.status === "pending" && (
                          <button
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition-colors"
                            onClick={() => handleApproveOrder(order.request._id)}
                            type="button"
                            disabled={submitting}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Check size={14} />
                              Approve
                            </span>
                          </button>
                        )}

                        {order.request.status === "pending" && (
                          <button
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors"
                            onClick={() => handleOpenRejectModal(order)}
                            type="button"
                            disabled={submitting}
                          >
                            <span className="inline-flex items-center gap-1">
                              <X size={14} />
                              Reject
                            </span>
                          </button>
                        )}

                        {!order.loan && order.request.status === "ready" && (
                          <button
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/40 hover:bg-blue-500/25 transition-colors"
                            onClick={() => handleStartLoan(order.request._id)}
                            type="button"
                            disabled={submitting}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Truck size={14} />
                              Start Loan
                            </span>
                          </button>
                        )}

                        {order.loan && (order.loan.status === "active" || order.loan.status === "overdue") && (
                          <button
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition-colors"
                            onClick={() => handleCompleteLoan(order.loan!._id)}
                            type="button"
                            disabled={submitting}
                          >
                            <span className="inline-flex items-center gap-1">
                              <CircleCheck size={14} />
                              Complete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="modal-overlay items-start md:items-center overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeCreateModal()}
        >
          <div className="modal-content max-w-6xl w-full max-h-[calc(100vh-1rem)] md:max-h-[94vh] overflow-y-auto my-2 md:my-0">
            <div className="modal-header">
              <div>
                <h2 className="text-2xl font-bold text-white">Register New Order</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Register walk-in orders and review all details before creating the request.
                </p>
              </div>
              <button className="btn-icon text-gray-400" onClick={closeCreateModal} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body p-0">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]">
                <div className="p-6 md:p-7 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Customer *</label>
                      <select
                        value={formData.customerId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))}
                        className="input"
                      >
                        <option value="">Select customer</option>
                        {customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {formatCustomerName(customer)} - {customer.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        min={todayDate}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const nextStartDate = e.target.value;
                            const nextEndDate = prev.endDate && prev.endDate < nextStartDate
                              ? nextStartDate
                              : prev.endDate;
                            return {
                              ...prev,
                              startDate: nextStartDate,
                              endDate: nextEndDate,
                            };
                          })
                        }
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        min={formData.startDate || todayDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group md:col-span-2">
                      <label className="form-label">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        className="input min-h-[96px]"
                        placeholder="Optional notes for this order"
                      />
                    </div>
                  </div>

                  <div className="border border-[#333] rounded-lg p-4 space-y-4 bg-[#161616]">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <h3 className="text-white font-semibold">Products and Services *</h3>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={handleAddDraftItem}
                      >
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formItems.map((item) => (
                        <div
                          key={item.localId}
                          className="grid grid-cols-1 md:grid-cols-[220px_1fr_120px_44px] gap-3 items-end"
                        >
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                              value={item.categoryId}
                              onChange={(e) => handleDraftItemChange(item.localId, { categoryId: e.target.value })}
                              className="input"
                            >
                              <option value="">Select category</option>
                              {materialCategories.map((category) => (
                                <option key={category._id} value={category._id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Material Type</label>
                            <select
                              value={item.materialTypeId}
                              onChange={(e) => handleDraftItemChange(item.localId, { materialTypeId: e.target.value })}
                              className="input"
                              disabled={!item.categoryId}
                            >
                              <option value="">{item.categoryId ? "Select material type" : "Select category first"}</option>
                              {materialTypes
                                .filter(
                                  (material) =>
                                    extractCategoryId(
                                      (material as MaterialType & {
                                        categoryId?: string | string[] | { _id?: string } | { _id?: string }[];
                                      }).categoryId,
                                    ) === item.categoryId,
                                )
                                .map((material) => (
                                  <option key={material._id} value={material._id}>
                                    {material.name} - {formatMoney(material.pricePerDay)}/day
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Quantity</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleDraftItemChange(item.localId, { quantity: e.target.value })}
                              className="input"
                            />
                          </div>

                          <button
                            type="button"
                            className="danger-icon-btn"
                            title="Remove item"
                            onClick={() => handleDraftItemRemove(item.localId)}
                          >
                            <Trash2 size={18} />
                          </button>

                          {item.materialTypeId && selectedDraftById.get(item.localId)?.name && (
                            <div className="md:col-span-4 rounded-lg border border-[#3d3d3d] bg-[#121212] px-3 py-3 space-y-2">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <p className="text-sm font-semibold text-white">
                                  {selectedDraftById.get(item.localId)?.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
                                    {formatMoney(selectedDraftById.get(item.localId)?.unitPrice)} / day
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                    Qty: {selectedDraftById.get(item.localId)?.quantity ?? 1}
                                  </span>
                                </div>
                              </div>

                              {selectedDraftById.get(item.localId)?.description && (
                                <p className="text-xs text-gray-400">
                                  {selectedDraftById.get(item.localId)?.description}
                                </p>
                              )}

                              {(selectedDraftById.get(item.localId)?.includes.length ?? 0) > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Category</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedDraftById.get(item.localId)?.includes.map((entry) => (
                                      <span
                                        key={`${item.localId}-${entry}`}
                                        className="text-[11px] px-2 py-1 rounded bg-[#1f1f1f] text-gray-300 border border-[#333]"
                                      >
                                        {entry}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="border-t xl:border-t-0 xl:border-l border-[#333] bg-[#151515] p-6 space-y-5">
                  <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Current Draft</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-gray-300">Rows: <span className="text-white font-semibold">{formItems.length}</span></p>
                      <p className="text-gray-300">Selected Items: <span className="text-white font-semibold">{selectedDraftRows.length}</span></p>
                      <p className="text-gray-300">Categories: <span className="text-white font-semibold">{materialCategories.length}</span></p>
                      <p className="text-gray-300">Materials: <span className="text-white font-semibold">{materialTypes.length}</span></p>
                      <p className="text-gray-300">Customers: <span className="text-white font-semibold">{customers.length}</span></p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 space-y-3">
                    <p className="text-sm font-semibold text-white">Order Cost Preview</p>
                    {selectedDraftRows.length === 0 ? (
                      <p className="text-xs text-gray-500">Select products or services to see real catalog pricing.</p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {selectedDraftRows.map(({ item, detail }) => {
                            const lineTotal = (detail?.unitPrice ?? 0) * (detail?.quantity ?? 1);
                            return (
                              <div key={`summary-${item.localId}`} className="text-xs border border-[#333] rounded-md p-2 bg-[#151515]">
                                <p className="text-gray-200 font-medium truncate">{detail?.name}</p>
                                <p className="text-gray-400 mt-1">
                                  {detail?.quantity ?? 1} x {formatMoney(detail?.unitPrice)} = {formatMoney(lineTotal)} / day
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-2 border-t border-[#333] flex items-center justify-between">
                          <span className="text-sm text-gray-300">Estimated daily total</span>
                          <span className="text-base font-semibold text-[#FFD700]">{formatMoney(estimatedDailyTotal)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {(!hasCustomers || !hasSelectableItems) && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-3">
                      <p className="text-sm font-semibold text-red-300">Missing required setup data</p>
                      <p className="text-xs text-red-200/90">
                        You need at least one customer and one material type to create orders.
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 space-y-3">
                    <p className="text-sm font-semibold text-white">Quick Links</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/app/customers")}
                        className="btn-secondary text-sm w-full"
                      >
                        Manage Customers
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/app/material-categories")}
                        className="btn-secondary text-sm w-full"
                      >
                        Manage Material Categories
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/app/material-types")}
                        className="btn-secondary text-sm w-full"
                      >
                        Manage Material Types
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/app/material-instances")}
                        className="btn-secondary text-sm w-full"
                      >
                        Manage Inventory Items
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeCreateModal} type="button" disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateOrder}
                type="button"
                disabled={submitting || !hasCustomers || !hasSelectableItems}
              >
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && activeOrder && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}>
          <div className="modal-content max-w-5xl max-h-[92vh] overflow-hidden">
            <div className="modal-header">
              <div>
                <h2 className="text-2xl font-bold text-white">Order Details</h2>
                <p className="text-sm text-gray-400 mt-1">Review full order data and current workflow step.</p>
              </div>
              <button className="btn-icon text-gray-400" onClick={() => setShowDetailsModal(false)} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body p-0">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
                <div className="p-6 md:p-7 space-y-5 max-h-[calc(92vh-84px)] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Request ID</p>
                      <p className="text-white font-semibold break-all">{activeOrder.request._id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Customer</p>
                      <p className="text-white font-semibold">{activeOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Start Date</p>
                      <p className="text-gray-300">{formatDate(activeOrder.request.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">End Date</p>
                      <p className="text-gray-300">{formatDate(activeOrder.request.endDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm mb-2">Products / Services</p>
                    <div className="space-y-2">
                      {activeOrder.displayItems.map((itemLabel) => (
                        <div key={itemLabel} className="text-gray-200 text-sm border border-[#333] rounded-lg px-3 py-2 bg-[#1a1a1a]">
                          {itemLabel}
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeOrder.request.notes && (
                    <div>
                      <p className="text-gray-500 text-sm">Notes</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{activeOrder.request.notes}</p>
                    </div>
                  )}
                </div>

                <aside className="border-t lg:border-t-0 lg:border-l border-[#333] bg-[#151515] p-6 space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Workflow Tracking</p>
                    <div className="space-y-2">
                      {WORKFLOW_STEPS.map((step, index) => {
                        const activeStepIndex = getStepIndex(activeOrder.workflowStatus);
                        const reached = index <= activeStepIndex;
                        return (
                          <div
                            key={step.status}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              reached
                                ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                                : "border-[#333] text-gray-500"
                            }`}
                          >
                            {step.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-[#333] rounded-lg p-3 bg-[#1a1a1a]">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Current Status</p>
                    <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(activeOrder.workflowStatus)}`}>
                      {activeOrder.workflowLabel}
                    </span>
                  </div>

                  {(activeOrder.workflowStatus === "order_rejected" ||
                    activeOrder.workflowStatus === "order_cancelled") && (
                    <p className="text-red-300 text-sm">
                      This order is in a terminal state: {activeOrder.workflowLabel}
                    </p>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && rejectTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}>
          <div className="modal-content max-w-2xl overflow-hidden">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-white">Reject Order</h2>
                <p className="text-sm text-gray-400 mt-1">Provide a clear reason that can be shared with the customer.</p>
              </div>
              <button className="btn-icon text-gray-400" onClick={() => setShowRejectModal(false)} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <p className="text-gray-300 text-sm">
                Provide a rejection reason for request <span className="text-white font-semibold">{rejectTarget.request._id}</span>.
              </p>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input min-h-[130px]"
                  placeholder="Example: Required items are not available in stock"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)} type="button" disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleRejectOrder}
                type="button"
                disabled={submitting}
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
