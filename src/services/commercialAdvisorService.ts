import type { ApiSuccessResponse } from "../lib/api";

// Sample Data
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+573001234567",
    company: "Acme Corp",
    city: "Bogotá",
    status: "active",
    totalOrders: 5,
    totalSpent: 2500,
  },
];

const SAMPLE_ORDERS: Order[] = [
  {
    id: "1",
    orderId: "ORD-001",
    customer: "John Doe",
    date: "2024-01-15",
    items: 3,
    total: 500,
    status: "completed",
    rentalStart: "2024-01-15",
    rentalEnd: "2024-01-20",
  },
];

const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: "1",
    contractId: "CTR-001",
    customer: "John Doe",
    signDate: "2024-01-10",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    totalValue: 5000,
    status: "active",
    items: 10,
  },
];

const SAMPLE_RENTALS: Rental[] = [
  {
    id: "1",
    rentalId: "RNT-001",
    customer: "John Doe",
    materials: ["Material A", "Material B"],
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    daysElapsed: 15,
    totalDays: 32,
    status: "active",
    depositAmount: 500,
  },
];

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV-001",
    customer: "John Doe",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    amount: 2500,
    paid: 1500,
    remaining: 1000,
    status: "partial",
    rentalId: "1",
  },
];

// Customer Management
export interface Customer {
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

// Order Management
export interface Order {
  id: string;
  orderId: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  rentalStart: string;
  rentalEnd: string;
}

// Contract Management
export interface Contract {
  id: string;
  contractId: string;
  customer: string;
  signDate: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: "draft" | "active" | "completed" | "cancelled";
  items: number;
}

// Rental Management
export interface Rental {
  id: string;
  rentalId: string;
  customer: string;
  materials: string[];
  startDate: string;
  endDate: string;
  daysElapsed: number;
  totalDays: number;
  status: "active" | "pending" | "returned" | "overdue";
  depositAmount: number;
}

// Invoice Management
export interface Invoice {
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

// Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  activeRentals: number;
}

// Service functions with mock data
export const commercialAdvisorService = {
  // Dashboard
  getDashboardStats: async (): Promise<ApiSuccessResponse<DashboardStats>> => {
    return Promise.resolve({
      status: "success" as const,
      data: {
        totalOrders: 342,
        totalCustomers: 156,
        monthlyRevenue: 45800,
        activeRentals: 87,
      },
    });
  },

  // Customers
  getCustomers: async (): Promise<ApiSuccessResponse<Customer[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_CUSTOMERS,
    });
  },

  getCustomerById: async (_id: string): Promise<ApiSuccessResponse<Customer>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_CUSTOMERS[0],
    });
  },

  createCustomer: async (customer: Omit<Customer, "id">): Promise<ApiSuccessResponse<Customer>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...customer, id: "new" } as Customer,
    });
  },

  updateCustomer: async (_id: string, customer: Partial<Customer>): Promise<ApiSuccessResponse<Customer>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...customer, id: "1" } as Customer,
    });
  },

  deleteCustomer: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Orders
  getOrders: async (): Promise<ApiSuccessResponse<Order[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_ORDERS,
    });
  },

  getOrderById: async (_id: string): Promise<ApiSuccessResponse<Order>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_ORDERS[0],
    });
  },

  createOrder: async (order: Omit<Order, "id">): Promise<ApiSuccessResponse<Order>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...order, id: "new" } as Order,
    });
  },

  updateOrder: async (_id: string, order: Partial<Order>): Promise<ApiSuccessResponse<Order>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...order, id: "1" } as Order,
    });
  },

  deleteOrder: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Contracts
  getContracts: async (): Promise<ApiSuccessResponse<Contract[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_CONTRACTS,
    });
  },

  getContractById: async (_id: string): Promise<ApiSuccessResponse<Contract>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_CONTRACTS[0],
    });
  },

  createContract: async (contract: Omit<Contract, "id">): Promise<ApiSuccessResponse<Contract>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...contract, id: "new" } as Contract,
    });
  },

  updateContract: async (_id: string, contract: Partial<Contract>): Promise<ApiSuccessResponse<Contract>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...contract, id: "1" } as Contract,
    });
  },

  deleteContract: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Rentals
  getRentals: async (): Promise<ApiSuccessResponse<Rental[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_RENTALS,
    });
  },

  getRentalById: async (_id: string): Promise<ApiSuccessResponse<Rental>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_RENTALS[0],
    });
  },

  createRental: async (rental: Omit<Rental, "id">): Promise<ApiSuccessResponse<Rental>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...rental, id: "new" } as Rental,
    });
  },

  updateRental: async (_id: string, rental: Partial<Rental>): Promise<ApiSuccessResponse<Rental>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...rental, id: "1" } as Rental,
    });
  },

  deleteRental: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Invoices
  getInvoices: async (): Promise<ApiSuccessResponse<Invoice[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_INVOICES,
    });
  },

  getInvoiceById: async (_id: string): Promise<ApiSuccessResponse<Invoice>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_INVOICES[0],
    });
  },

  createInvoice: async (invoice: Omit<Invoice, "id">): Promise<ApiSuccessResponse<Invoice>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...invoice, id: "new" } as Invoice,
    });
  },

  updateInvoice: async (_id: string, invoice: Partial<Invoice>): Promise<ApiSuccessResponse<Invoice>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...invoice, id: "1" } as Invoice,
    });
  },

  deleteInvoice: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },
};
