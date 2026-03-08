import { useState, useEffect, useCallback } from "react";
import { Calendar, Users, Clock, Plus, Trash2, Edit, X } from "lucide-react";
import { EventCard, StatCard } from "../components";
import { getRequests, createRequest, updateRequest } from "../../../services/adminService";
import { getCustomers } from "../../../services/customerService";
import { getPackages } from "../../../services/materialService";
import { ApiError } from "../../../lib/api";
import { useAlertModal } from "../../../hooks/useAlertModal";
import { validateAddressField } from "../../../utils/validators";

type Event = {
  id: string;
  name: string;
  date: string;
  status: "Upcoming" | "Live" | "Completed";
  capacity: number;
  attendees: number;
  customerId?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

type RequestApi = {
  _id?: string;
  id?: string;
  requestedStartDate?: string;
  requested_start_date?: string;
  start_date?: string;
  startDate?: string;
  requestedEndDate?: string;
  requested_end_date?: string;
  end_date?: string;
  endDate?: string;
  customerId?: string | { _id?: string };
  customer_id?: string;
  packageId?: string | { _id?: string };
  package_id?: string;
  notes?: string;
  name?: string;
  deposit?: { amount?: number };
};

type CustomerOption = {
  _id?: string;
  id?: string;
  email?: string;
  name?: {
    firstName?: string;
    firstSurname?: string;
  };
};

type PackageOption = {
  _id?: string;
  id?: string;
  name?: string;
};

type MyEventFormField =
  | "name"
  | "customerId"
  | "packageId"
  | "startDate"
  | "endDate"
  | "depositAmount"
  | "depositMethod";

export default function MyEvents() {
  const { showError, AlertModal } = useAlertModal();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [depositAmountDisplay, setDepositAmountDisplay] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<MyEventFormField, string>>>({});
  const [formTouched, setFormTouched] = useState<Partial<Record<MyEventFormField, boolean>>>({});
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    packageId: "",
    startDate: "",
    endDate: "",
    depositAmount: "",
    depositMethod: "cash",
  });

  const formatCop = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-900 rounded-xl py-3 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"}`;

  const validateField = useCallback(
    (field: MyEventFormField, data = formData): string | undefined => {
      switch (field) {
        case "name": {
          const trimmed = data.name.trim();
          if (!trimmed) return "Event name is required";
          const result = validateAddressField(trimmed, "Event name");
          return result.isValid ? undefined : result.message;
        }
        case "customerId":
          return data.customerId ? undefined : "Customer is required";
        case "packageId":
          return data.packageId ? undefined : "Package is required";
        case "startDate":
          return data.startDate ? undefined : "Start date is required";
        case "endDate": {
          if (!data.endDate) return "End date is required";
          if (data.startDate && data.endDate < data.startDate) {
            return "End date must be on or after start date";
          }
          return undefined;
        }
        case "depositAmount": {
          if (!data.depositAmount) return undefined;
          const amount = Number(data.depositAmount);
          if (Number.isNaN(amount) || amount < 0) {
            return "Deposit amount must be a valid positive number";
          }
          return undefined;
        }
        default:
          return undefined;
      }
    },
    [formData],
  );

  const handleFieldBlur = (field: MyEventFormField) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateField(field);
    setFormErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const getFieldError = (field: MyEventFormField) =>
    formTouched[field] ? formErrors[field] : undefined;

  useEffect(() => {
    if (!Object.values(formTouched).some(Boolean)) return;

    setFormErrors((prev) => {
      const next = { ...prev };
      (Object.keys(formTouched) as MyEventFormField[]).forEach((field) => {
        if (!formTouched[field]) return;
        const message = validateField(field);
        if (message) next[field] = message;
        else delete next[field];
      });
      return next;
    });
  }, [formData, formTouched, validateField]);

  const handleFieldChange = (field: MyEventFormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getRequests();

      const mappedEvents: Event[] = (response.data.requests ?? []).map((request: RequestApi) => {
        const startRaw =
          (request.requestedStartDate as string) ||
          (request.requested_start_date as string) ||
          (request.start_date as string) ||
          (request.startDate as string);
        const endRaw =
          (request.requestedEndDate as string) ||
          (request.requested_end_date as string) ||
          (request.end_date as string) ||
          (request.endDate as string) ||
          startRaw;

        const startDate = startRaw ? new Date(startRaw) : new Date();
        const endDate = endRaw ? new Date(endRaw) : new Date();
        const now = new Date();

        let status: "Upcoming" | "Live" | "Completed" = "Upcoming";
        if (endDate < now) {
          status = "Completed";
        } else if (startDate <= now && now <= endDate) {
          status = "Live";
        }

        const customerId =
          ((request.customerId as Record<string, unknown>)?._id as string) ||
          (request.customerId as string) ||
          (request.customer_id as string);
        const packageId =
          ((request.packageId as Record<string, unknown>)?._id as string) ||
          (request.packageId as string) ||
          (request.package_id as string);

        return {
          id: (request._id as string) || (request.id as string),
          name: (request.notes as string) || (request.name as string) || "Event",
          date: startRaw || "",
          status,
          capacity: ((request.deposit as Record<string, unknown>)?.amount as number) || 0,
          attendees: 0,
          customerId,
          packageId,
          startDate: startRaw || "",
          endDate: endRaw || "",
          notes: (request.notes as string) || "",
        };
      });

      setEvents(mappedEvents);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load events";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [customersRes, packagesRes] = await Promise.all([getCustomers(), getPackages()]);

      setCustomers(customersRes.data.customers || []);
      setPackages(packagesRes.data.packages || []);
    } catch {
      // Non-critical: ignore
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchOptions();
  }, []);

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditingId(event.id);
      setFormData({
        name: event.name,
        customerId: event.customerId || "",
        packageId: event.packageId || "",
        startDate: event.startDate || event.date || "",
        endDate: event.endDate || "",
        depositAmount: event.capacity ? String(event.capacity) : "",
        depositMethod: "cash",
      });
      setDepositAmountDisplay(event.capacity ? formatCop(event.capacity) : "");
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        customerId: "",
        packageId: "",
        startDate: "",
        endDate: "",
        depositAmount: "",
        depositMethod: "cash",
      });
      setDepositAmountDisplay("");
    }
    setFormErrors({});
    setFormTouched({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: "",
      customerId: "",
      packageId: "",
      startDate: "",
      endDate: "",
      depositAmount: "",
      depositMethod: "cash",
    });
    setDepositAmountDisplay("");
    setFormErrors({});
    setFormTouched({});
  };

  const handleSaveEvent = async () => {
    try {
      if (!formData.customerId || !formData.packageId || !formData.startDate || !formData.endDate) {
        showError("Por favor completa todos los campos requeridos");
        return;
      }

      setSubmitting(true);

      const payload = {
        customerId: formData.customerId,
        packageId: formData.packageId,
        requestedStartDate: formData.startDate,
        requestedEndDate: formData.endDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        items: [],
        deposit: {
          amount: formData.depositAmount ? Number(formData.depositAmount) : 0,
          method: formData.depositMethod,
          status: "pending",
        },
        notes: formData.name || "",
      };

      if (editingId) {
        await updateRequest(editingId, payload);
      } else {
        await createRequest(payload);
      }

      handleCloseModal();
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Unknown error";
      showError("Error: " + message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const reason = prompt("Reason for cancellation", "Cancelled by administrator");
      if (reason === null) return;
      // Use rejectRequest as a cancellation mechanism
      const { rejectRequest } = await import("../../../services/loanService");
      await rejectRequest(eventId, reason);
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError("Error: " + message);
    }
  };

  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const liveCount = events.filter((e) => e.status === "Live").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Events</h1>
          <p className="text-gray-400">Manage and review your events</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition"
        >
          <Plus size={20} />
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="My Events" value={events.length} icon={<Calendar size={28} />} />
        <StatCard label="Total Deposits" value={totalCapacity} icon={<Users size={28} />} />
        <StatCard label="Currently Live" value={liveCount} icon={<Clock size={28} />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Event List</h2>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading events...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No events found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div key={ev.id} className="relative">
                <EventCard
                  name={ev.name}
                  date={ev.date}
                  status={ev.status}
                  capacity={ev.capacity}
                  attendees={ev.attendees}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleOpenModal(ev)}
                    className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-bold">{editingId ? "Edit Event" : "Create New Event"}</h2>
              <button
                onClick={handleCloseModal}
                className="btn-icon"
                title="Close modal"
                aria-label="Close modal"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Event Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      onBlur={() => handleFieldBlur("name")}
                      className={inputClass(!!getFieldError("name"))}
                      placeholder="Event name"
                      maxLength={100}
                      disabled={submitting}
                    />
                    {getFieldError("name") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("name")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select
                      title="Customer"
                      value={formData.customerId}
                      onChange={(e) => handleFieldChange("customerId", e.target.value)}
                      onBlur={() => handleFieldBlur("customerId")}
                      className={inputClass(!!getFieldError("customerId"))}
                      disabled={submitting}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option
                          key={customer._id || customer.id}
                          value={customer._id || customer.id}
                        >
                          {customer.name?.firstName || ""} {customer.name?.firstSurname || ""} (
                          {customer.email || "No email"})
                        </option>
                      ))}
                    </select>
                    {getFieldError("customerId") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("customerId")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Package *</label>
                    <select
                      title="Package"
                      value={formData.packageId}
                      onChange={(e) => handleFieldChange("packageId", e.target.value)}
                      onBlur={() => handleFieldBlur("packageId")}
                      className={inputClass(!!getFieldError("packageId"))}
                      disabled={submitting}
                    >
                      <option value="">Select a package</option>
                      {packages.map((pkg) => (
                        <option key={pkg._id || pkg.id} value={pkg._id || pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    {getFieldError("packageId") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("packageId")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      title="Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleFieldChange("startDate", e.target.value)}
                      onBlur={() => handleFieldBlur("startDate")}
                      className={inputClass(!!getFieldError("startDate"))}
                      disabled={submitting}
                    />
                    {getFieldError("startDate") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("startDate")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      title="End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleFieldChange("endDate", e.target.value)}
                      onBlur={() => handleFieldBlur("endDate")}
                      className={inputClass(!!getFieldError("endDate"))}
                      disabled={submitting}
                    />
                    {getFieldError("endDate") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("endDate")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deposit Amount</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={depositAmountDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        handleFieldChange("depositAmount", raw);
                        setDepositAmountDisplay(raw ? formatCop(parseInt(raw, 10)) : "");
                      }}
                      onBlur={() => handleFieldBlur("depositAmount")}
                      className={inputClass(!!getFieldError("depositAmount"))}
                      placeholder="Ej: $ 80.000"
                      disabled={submitting}
                    />
                    {getFieldError("depositAmount") && (
                      <p className="text-red-400 text-xs mt-1">{getFieldError("depositAmount")}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deposit Method</label>
                    <select
                      title="Deposit Method"
                      value={formData.depositMethod}
                      onChange={(e) => handleFieldChange("depositMethod", e.target.value)}
                      className={inputClass(false)}
                      disabled={submitting}
                    >
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting
                    ? editingId
                      ? "Saving..."
                      : "Creating..."
                    : editingId
                      ? "Save Changes"
                      : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AlertModal />
    </div>
  );
}
