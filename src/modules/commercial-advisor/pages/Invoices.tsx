import { useState } from "react";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  Search,
  FileText,
  DollarSign,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceId: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
  remaining: number;
  status: "paid" | "pending" | "overdue" | "partial";
  rentalId: string;
}

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV-2024-001",
    customer: "Acme Corporation",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    amount: 2500,
    paid: 2500,
    remaining: 0,
    status: "paid",
    rentalId: "RNT-2024-001",
  },
  {
    id: "2",
    invoiceId: "INV-2024-002",
    customer: "Tech Solutions Inc",
    date: "2024-01-18",
    dueDate: "2024-02-18",
    amount: 1800,
    paid: 1800,
    remaining: 0,
    status: "paid",
    rentalId: "RNT-2024-002",
  },
  {
    id: "3",
    invoiceId: "INV-2024-003",
    customer: "Creative Events Ltd",
    date: "2024-01-20",
    dueDate: "2024-02-20",
    amount: 3200,
    paid: 1600,
    remaining: 1600,
    status: "partial",
    rentalId: "RNT-2024-003",
  },
  {
    id: "4",
    invoiceId: "INV-2024-004",
    customer: "Business Solutions",
    date: "2024-01-21",
    dueDate: "2024-02-21",
    amount: 1500,
    paid: 0,
    remaining: 1500,
    status: "pending",
    rentalId: "RNT-2024-004",
  },
  {
    id: "5",
    invoiceId: "INV-2024-005",
    customer: "Global Industries",
    date: "2024-01-10",
    dueDate: "2024-02-10",
    amount: 4200,
    paid: 0,
    remaining: 4200,
    status: "overdue",
    rentalId: "RNT-2023-005",
  },
];

export default function Invoices() {
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = invoices.filter(
    (invoice) =>
      invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "partial":
        return "bg-blue-500/20 text-blue-400";
      case "overdue":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <p className="text-gray-400 mt-1">Create and track invoice payments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filtered.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-[#FFD700]" />
                  <h3 className="text-lg font-bold text-white">{invoice.invoiceId}</h3>
                </div>
                <p className="text-gray-400 text-sm">{invoice.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Download size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Eye size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pb-4 border-b border-[#333]">
              <div>
                <p className="text-gray-400 text-xs mb-1">Date</p>
                <p className="text-white font-semibold">{invoice.date}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Due Date</p>
                <p className="text-white font-semibold">{invoice.dueDate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Amount</p>
                <p className="text-white font-bold">${invoice.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Paid</p>
                <p className="text-green-400 font-bold">${invoice.paid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Remaining</p>
                <p className={`font-bold ${invoice.remaining > 0 ? "text-red-400" : "text-green-400"}`}>
                  ${invoice.remaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              {invoice.remaining > 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <DollarSign size={14} />
                  <span>{Math.round((invoice.paid / invoice.amount) * 100)}% paid</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No invoices found</p>
        </div>
      )}
    </div>
  );
}
