import React, { useState } from "react";
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
} from "lucide-react";

interface ReportMetrics {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const SAMPLE_REPORTS: ReportMetrics[] = [
  {
    label: "Total Revenue",
    value: "$156,850",
    icon: <DollarSign size={32} />,
    trend: "18% from last month",
    trendUp: true,
  },
  {
    label: "Average Order Value",
    value: "$1,245",
    icon: <BarChart3 size={32} />,
    trend: "5% increase",
    trendUp: true,
  },
  {
    label: "Total Customers",
    value: "156",
    icon: <Users size={32} />,
    trend: "12 new this month",
    trendUp: true,
  },
  {
    label: "Growth Rate",
    value: "22%",
    icon: <TrendingUp size={32} />,
    trend: "YoY growth",
    trendUp: true,
  },
];

interface ReportData {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  generatedDate: string;
}

const SAMPLE_REPORT_LIST: ReportData[] = [
  {
    id: "1",
    name: "Monthly Sales Report",
    description: "Comprehensive sales metrics for January 2024",
    type: "Sales",
    period: "Monthly",
    generatedDate: "2024-02-01",
  },
  {
    id: "2",
    name: "Customer Analytics",
    description: "Customer acquisition and retention analysis",
    type: "Analytics",
    period: "Monthly",
    generatedDate: "2024-02-01",
  },
  {
    id: "3",
    name: "Rental Performance",
    description: "Rental utilization and revenue analysis",
    type: "Performance",
    period: "Monthly",
    generatedDate: "2024-02-01",
  },
  {
    id: "4",
    name: "Payment Analysis",
    description: "Payment status and collection metrics",
    type: "Finance",
    period: "Monthly",
    generatedDate: "2024-02-01",
  },
];

export default function Reports() {
  const [reports] = useState<ReportData[]>(SAMPLE_REPORT_LIST);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 mt-1">Track key metrics and generate detailed reports</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SAMPLE_REPORTS.map((metric, idx) => (
          <div
            key={idx}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{metric.label}</p>
                <h3 className="text-3xl font-bold text-white mt-2">{metric.value}</h3>
                {metric.trend && (
                  <p className={`text-xs mt-2 ${metric.trendUp ? "text-green-400" : "text-red-400"}`}>
                    {metric.trendUp ? "↑" : "↓"} {metric.trend}
                  </p>
                )}
              </div>
              <div className="text-[#FFD700] opacity-80">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Generation */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-bold text-white mb-6">Generate Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Report Type
            </label>
            <select className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer">
              <option>Sales Report</option>
              <option>Customer Analytics</option>
              <option>Rental Performance</option>
              <option>Payment Analysis</option>
              <option>Inventory Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-[#121212] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all"
            />
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-[8px] hover:bg-[#FFC700] transition-all">
          <Calendar size={20} />
          Generate Report
        </button>
      </div>

      {/* Recent Reports */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-bold text-white mb-6">Recent Reports</h2>

        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333] hover:border-[#FFD700] transition-all group"
            >
              <div className="flex-1">
                <p className="text-white font-semibold">{report.name}</p>
                <p className="text-gray-400 text-sm">{report.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded">
                    {report.type}
                  </span>
                  <span className="text-xs text-gray-500">{report.generatedDate}</span>
                </div>
              </div>
              <button className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 group-hover:text-[#FFD700] transition-all">
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
