import { useState, useEffect } from "react";
import { Calendar, Users, Clock, Plus, Trash2, Edit } from "lucide-react";
import { EventCard, StatCard } from "../components";
import {
  getRequests,
  createRequest,
  updateRequest,
} from "../../../services/adminService";
import { getCustomers } from "../../../services/customerService";
import { getPackages } from "../../../services/materialService";
import { ApiError } from "../../../lib/api";

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

export default function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    packageId: "",
    startDate: "",
    endDate: "",
    depositAmount: "",
    depositMethod: "cash",
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getRequests();

      const mappedEvents: Event[] = (response.data.requests ?? []).map(
        (request: any) => {
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
            name:
              (request.notes as string) || (request.name as string) || "Event",
            date: startRaw || "",
            status,
            capacity:
              ((request.deposit as Record<string, unknown>)
                ?.amount as number) || 0,
            attendees: 0,
            customerId,
            packageId,
            startDate: startRaw || "",
            endDate: endRaw || "",
            notes: (request.notes as string) || "",
          };
        },
      );

      setEvents(mappedEvents);
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load events";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [customersRes, packagesRes] = await Promise.all([
        getCustomers(),
        getPackages(),
      ]);

      setCustomers(customersRes.data.customers || []);
      setPackages(packagesRes.data.packages || []);
    } catch  {
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
    }
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
  };

  const handleSaveEvent = async () => {
    try {
      if (
        !formData.customerId ||
        !formData.packageId ||
        !formData.startDate ||
        !formData.endDate
      ) {
        alert("Por favor completa todos los campos requeridos");
        return;
      }

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
      alert("Error: " + message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

    try {
      const reason = prompt(
        "Motivo de cancelación",
        "Cancelado por el administrador",
      );
      if (reason === null) return;
      // Use rejectRequest as a cancellation mechanism
      const { rejectRequest } = await import("../../../services/loanService");
      await rejectRequest(eventId, reason);
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Error: " + message);
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
        <StatCard
          label="My Events"
          value={events.length}
          icon={<Calendar size={28} />}
        />
        <StatCard
          label="Total Deposits"
          value={totalCapacity}
          icon={<Users size={28} />}
        />
        <StatCard
          label="Currently Live"
          value={liveCount}
          icon={<Clock size={28} />}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Event List</h2>

        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Loading events...
          </div>
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
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingId ? "Edit Event" : "Create New Event"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Event name"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option
                      key={customer._id || customer.id}
                      value={customer._id || customer.id}
                    >
                      {customer.name?.firstName || ""}{" "}
                      {customer.name?.firstSurname || ""} (
                      {customer.email || "No email"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Package
                </label>
                <select
                  value={formData.packageId}
                  onChange={(e) =>
                    setFormData({ ...formData, packageId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg._id || pkg.id} value={pkg._id || pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, depositAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Deposit Method
                </label>
                <select
                  value={formData.depositMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, depositMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-yellow-400 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
