import { Search, Filter, X } from "lucide-react";
import type { MaterialCategory } from "../../../../../types/api";
import { useState } from "react";

interface MaterialFiltersProps {
  categories: MaterialCategory[];
  onFilterChange: (filters: MaterialFilterState) => void;
}

export interface MaterialFilterState {
  searchTerm: string;
  categoryId: string;
  priceRange: {
    min: number;
    max: number;
  };
}

export function MaterialFilters({
  categories,
  onFilterChange,
}: MaterialFiltersProps) {
  const [filters, setFilters] = useState<MaterialFilterState>({
    searchTerm: "",
    categoryId: "",
    priceRange: {
      min: 0,
      max: 10000,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters, categoryId };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (
    type: "min" | "max",
    value: number,
  ) => {
    const newFilters = {
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [type]: value,
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const resetState: MaterialFilterState = {
      searchTerm: "",
      categoryId: "",
      priceRange: {
        min: 0,
        max: 10000,
      },
    };
    setFilters(resetState);
    onFilterChange(resetState);
  };

  const hasActiveFilters =
    filters.searchTerm || filters.categoryId || 
    filters.priceRange.min > 0 || filters.priceRange.max < 10000;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials by name or SKU..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceChange("min", parseFloat(e.target.value))}
                min="0"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceChange("max", parseFloat(e.target.value))}
                min="0"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
