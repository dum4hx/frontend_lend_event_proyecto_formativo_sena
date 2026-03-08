import { useState } from "react";
import { AlertCircle, XCircle, CheckCircle, Clock, Filter } from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  location?: string;
  itemSku?: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
}

const SAMPLE_ALERTS: Alert[] = [
  {
    id: "1",
    type: "critical",
    title: "Critical Stock Level",
    description: "SKU-015 (LED Light System) has reached critical stock level with only 5 units remaining",
    location: "B2",
    itemSku: "SKU-015",
    timestamp: "2024-02-20 14:30",
    status: "active",
  },
  {
    id: "2",
    type: "critical",
    title: "Count Discrepancy",
    description: "Location C2 count discrepancy detected - 3 units missing from inventory",
    location: "C2",
    timestamp: "2024-02-20 13:15",
    status: "active",
  },
  {
    id: "3",
    type: "warning",
    title: "Low Stock Alert",
    description: "SKU-032 (Sound Equipment) is approaching minimum threshold with 12 units",
    location: "C1",
    itemSku: "SKU-032",
    timestamp: "2024-02-20 12:00",
    status: "acknowledged",
  },
  {
    id: "4",
    type: "warning",
    title: "Location Full",
    description: "Location A2 is at 96% capacity - consider redistributing items",
    location: "A2",
    timestamp: "2024-02-20 11:30",
    status: "acknowledged",
  },
  {
    id: "5",
    type: "info",
    title: "Scheduled Maintenance",
    description: "Location C1 will be under maintenance from Feb 21 to Feb 23",
    location: "C1",
    timestamp: "2024-02-20 10:00",
    status: "resolved",
  },
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <XCircle size={20} />;
    case "warning":
      return <AlertCircle size={20} />;
    case "info":
      return <Clock size={20} />;
    default:
      return <AlertCircle size={20} />;
  }
};

const getAlertColor = (type: string) => {
  switch (type) {
    case "critical":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "warning":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "info":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return "bg-red-500/20 text-red-400";
    case "acknowledged":
      return "bg-yellow-500/20 text-yellow-400";
    case "resolved":
      return "bg-green-500/20 text-green-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(SAMPLE_ALERTS);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === "all") return true;
    return alert.status === filterStatus;
  });

  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;
  const criticalAlertsCount = alerts.filter((a) => a.type === "critical" && a.status === "active").length;

  const handleAcknowledge = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, status: "acknowledged" } : alert
      )
    );
  };

  const handleResolve = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, status: "resolved" } : alert
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Warehouse Alerts</h1>
        <p className="text-gray-400">Monitor and manage warehouse alerts and notifications</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-red-500/30 rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Critical Alerts</p>
              <h3 className="text-3xl font-bold text-red-400 mt-2">{criticalAlertsCount}</h3>
            </div>
            <XCircle size={40} className="text-red-400 opacity-40" />
          </div>
        </div>

        <div className="bg-[#121212] border border-yellow-500/30 rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <h3 className="text-3xl font-bold text-yellow-400 mt-2">{activeAlertsCount}</h3>
            </div>
            <AlertCircle size={40} className="text-yellow-400 opacity-40" />
          </div>
        </div>

        <div className="bg-[#121212] border border-green-500/30 rounded-[12px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <h3 className="text-3xl font-bold text-green-400 mt-2">
                {alerts.filter((a) => a.status === "resolved").length}
              </h3>
            </div>
            <CheckCircle size={40} className="text-green-400 opacity-40" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 w-fit">
        <Filter size={18} className="text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-transparent text-white focus:outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-[12px] p-6 ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="mt-1">{getAlertIcon(alert.type)}</div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{alert.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      {alert.location && (
                        <span className="text-xs opacity-75 font-mono">
                          Location: {alert.location}
                        </span>
                      )}
                      {alert.itemSku && (
                        <span className="text-xs opacity-75 font-mono">
                          SKU: {alert.itemSku}
                        </span>
                      )}
                      <span className="text-xs opacity-75">{alert.timestamp}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusBadge(alert.status)}`}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  {alert.status === "active" && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs font-semibold px-3 py-1 rounded btn-secondary opacity-70 hover:opacity-100 transition-opacity"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="text-xs font-semibold px-3 py-1 rounded btn-secondary opacity-70 hover:opacity-100 transition-opacity"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                  {alert.status === "acknowledged" && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="text-xs font-semibold px-3 py-1 rounded btn-secondary opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg font-semibold">All good!</p>
          <p className="text-gray-500 text-sm">No alerts matching your filter</p>
        </div>
      )}
    </div>
  );
}
