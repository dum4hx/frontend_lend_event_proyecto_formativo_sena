import type { ApiSuccessResponse } from "../lib/api";

// Sample Data
const SAMPLE_MATERIALS: Material[] = [
  {
    id: "1",
    name: "Office Chair",
    sku: "CHR-001",
    categoryId: "1",
    modelId: "1",
    price: 180,
    rentalPrice: 25,
    quantity: 45,
    status: "active",
  },
];

const SAMPLE_CATEGORIES: Category[] = [
  { id: "1", name: "Furniture", description: "Office furniture", materialCount: 5 },
];

const SAMPLE_MODELS: MaterialModel[] = [
  { id: "1", name: "Model A", categoryId: "1", description: "Description", variants: 3, status: "active" },
];

const SAMPLE_ATTRIBUTES: Attribute[] = [
  { id: "1", name: "Color", type: "select", values: ["Red", "Blue"], appliedTo: 5 },
];

const SAMPLE_PLANS: MaterialPlan[] = [
  { id: "1", name: "Plan A", categoryId: "1", duration: "30 days", price: 100, materials: ["1"], isActive: true },
];

// Material Management
export interface Material {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  modelId: string;
  price: number;
  rentalPrice: number;
  quantity: number;
  status: "active" | "inactive" | "discontinued";
}

export interface Category {
  id: string;
  name: string;
  description: string;
  materialCount: number;
}

export interface MaterialModel {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  variants: number;
  status: "active" | "inactive";
}

export interface Attribute {
  id: string;
  name: string;
  type: "select" | "text" | "number";
  values: string[];
  appliedTo: number;
}

export interface MaterialPlan {
  id: string;
  name: string;
  categoryId: string;
  duration: string;
  price: number;
  materials: string[];
  isActive: boolean;
}

// API Responses
export interface DashboardStats {
  totalMaterials: number;
  totalCategories: number;
  activePlans: number;
  outOfStockItems: number;
}

// Service functions with mock data
export const locationManagerService = {
  // Dashboard
  getDashboardStats: async (): Promise<ApiSuccessResponse<DashboardStats>> => {
    // Mock API call
    return Promise.resolve({
      status: "success" as const,
      data: {
        totalMaterials: 156,
        totalCategories: 12,
        activePlans: 28,
        outOfStockItems: 5,
      },
    });
  },

  // Materials
  getMaterials: async (): Promise<ApiSuccessResponse<Material[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_MATERIALS,
    });
  },

  getMaterialById: async (_id: string): Promise<ApiSuccessResponse<Material>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_MATERIALS[0],
    });
  },

  createMaterial: async (material: Omit<Material, "id">): Promise<ApiSuccessResponse<Material>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...material, id: "new" } as Material,
    });
  },

  updateMaterial: async (_id: string, material: Partial<Material>): Promise<ApiSuccessResponse<Material>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...material, id: "1" } as Material,
    });
  },

  deleteMaterial: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Categories
  getCategories: async (): Promise<ApiSuccessResponse<Category[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_CATEGORIES,
    });
  },

  createCategory: async (category: Omit<Category, "id">): Promise<ApiSuccessResponse<Category>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...category, id: "new" } as Category,
    });
  },

  updateCategory: async (_id: string, category: Partial<Category>): Promise<ApiSuccessResponse<Category>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...category, id: "1" } as Category,
    });
  },

  deleteCategory: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Models
  getModels: async (): Promise<ApiSuccessResponse<MaterialModel[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_MODELS,
    });
  },

  createModel: async (model: Omit<MaterialModel, "id">): Promise<ApiSuccessResponse<MaterialModel>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...model, id: "new" } as MaterialModel,
    });
  },

  updateModel: async (_id: string, model: Partial<MaterialModel>): Promise<ApiSuccessResponse<MaterialModel>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...model, id: "1" } as MaterialModel,
    });
  },

  deleteModel: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Attributes
  getAttributes: async (): Promise<ApiSuccessResponse<Attribute[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_ATTRIBUTES,
    });
  },

  createAttribute: async (attribute: Omit<Attribute, "id">): Promise<ApiSuccessResponse<Attribute>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...attribute, id: "new" } as Attribute,
    });
  },

  updateAttribute: async (_id: string, attribute: Partial<Attribute>): Promise<ApiSuccessResponse<Attribute>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...attribute, id: "1" } as Attribute,
    });
  },

  deleteAttribute: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },

  // Plans
  getPlans: async (): Promise<ApiSuccessResponse<MaterialPlan[]>> => {
    return Promise.resolve({
      status: "success" as const,
      data: SAMPLE_PLANS,
    });
  },

  createPlan: async (plan: Omit<MaterialPlan, "id">): Promise<ApiSuccessResponse<MaterialPlan>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...plan, id: "new" } as MaterialPlan,
    });
  },

  updatePlan: async (_id: string, plan: Partial<MaterialPlan>): Promise<ApiSuccessResponse<MaterialPlan>> => {
    return Promise.resolve({
      status: "success" as const,
      data: { ...plan, id: "1" } as MaterialPlan,
    });
  },

  deletePlan: async (_id: string): Promise<ApiSuccessResponse<void>> => {
    return Promise.resolve({ status: "success" as const, data: undefined });
  },
};
