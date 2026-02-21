import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Mail,
  Phone,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  status: "active" | "inactive";
  totalOrders: number;
  totalSpent: number;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@acme.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    city: "New York",
    status: "active",
    totalOrders: 15,
    totalSpent: 45000,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@techsol.com",
    phone: "+1 (555) 234-5678",
    company: "Tech Solutions Inc",
    city: "San Francisco",
    status: "active",
    totalOrders: 8,
    totalSpent: 28500,
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@events.com",
    phone: "+1 (555) 345-6789",
    company: "Creative Events Ltd",
    city: "Los Angeles",
    status: "active",
    totalOrders: 22,
    totalSpent: 67200,
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@business.com",
    phone: "+1 (555) 456-7890",
    company: "Business Solutions",
    city: "Chicago",
    status: "inactive",
    totalOrders: 5,
    totalSpent: 12500,
  },
  {
    id: "5",
    name: "Robert Wilson",
    email: "robert@global.com",
    phone: "+1 (555) 567-8901",
    company: "Global Industries",
    city: "Boston",
    status: "active",
    totalOrders: 18,
    totalSpent: 54000,
  },
];

export default function Customers() {
  const [customers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 mt-1">Manage customer information and relationships</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by name, company, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                <p className="text-[#FFD700] text-sm font-semibold">{customer.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4 pb-4 border-b border-[#333]">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail size={16} />
                <a href={`mailto:${customer.email}`} className="hover:text-[#FFD700] transition-all">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone size={16} />
                <span>{customer.phone}</span>
              </div>
              <p className="text-gray-400 text-sm">{customer.city}</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Orders</p>
                <p className="text-white font-bold text-lg">{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Total Spent</p>
                <p className="text-[#FFD700] font-bold text-lg">${customer.totalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 pt-4 border-t border-[#333]">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  customer.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {customer.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No customers found</p>
        </div>
      )}
    </div>
  );
}
