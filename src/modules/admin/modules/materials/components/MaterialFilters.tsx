import { Search, Filter, X } from "lucide-react";
import type { MaterialCategory, MaterialType } from "../../../../../types/api";
import { useState, useEffect } from "react";
import { getMaterialTypes } from "../../../../../services/materialService";

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
  searchExact?: boolean;
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

  const [types, setTypes] = useState<MaterialType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<MaterialType[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value, searchExact: false };
    setFilters(newFilters);
    onFilterChange(newFilters);
    // fetch suggestions
    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      setSuggestionsError(null);
      return;
    }
    (async () => {
      try {
        setLoadingSuggestions(true);
        setSuggestionsError(null);
        const resp = await getMaterialTypes({ search: value });
        setSuggestions(resp.data.materialTypes ?? []);
      } catch (err) {
        setSuggestionsError(err instanceof Error ? err.message : "Failed to fetch suggestions");
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters, categoryId };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  useEffect(() => {
    let mounted = true;
    const fetchTypes = async () => {
      if (!filters.categoryId) {
        setTypes([]);
        setTypesError(null);
        return;
      }
      try {
        setLoadingTypes(true);
        setTypesError(null);
        const resp = await getMaterialTypes({ categoryId: filters.categoryId });
        if (!mounted) return;
        setTypes(resp.data.materialTypes ?? []);
      } catch (err) {
        if (!mounted) return;
        setTypesError(err instanceof Error ? err.message : "Failed to load types");
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    };
    fetchTypes();
    return () => {
      mounted = false;
    };
  }, [filters.categoryId]);

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
      searchExact: false,
    };
    setFilters(resetState);
    onFilterChange(resetState);
  };

  const hasActiveFilters =
    filters.searchTerm || filters.categoryId || 
    filters.priceRange.min > 0 || filters.priceRange.max < 10000;

  return (
    <div className="bg-[#121212] border border-[#333] rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials by name..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
          />
          {/* Suggestions dropdown */}
          {suggestions.length > 0 || loadingSuggestions || suggestionsError ? (
            <ul className="absolute left-0 right-0 mt-1 bg-[#0f0f0f] border border-[#333] rounded max-h-48 overflow-auto z-20">
              {loadingSuggestions && (
                <li className="px-3 py-2 text-sm text-gray-400">Loading...</li>
              )}
              {suggestionsError && (
                <li className="px-3 py-2 text-sm text-red-400">{suggestionsError}</li>
              )}
              {suggestions.map((s) => (
                <li
                  key={s._id}
                  className="px-3 py-2 hover:bg-[#1a1a1a] cursor-pointer text-sm text-white"
                  onMouseDown={() => {
                    // onMouseDown to avoid input blur before click
                    const newFilters = { ...filters, searchTerm: s.name, searchExact: true };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                    setSuggestions([]);
                  }}
                >
                  <div className="font-medium">{s.name}</div>
                  {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
          <button
            onClick={() => {
              const newFilters = { ...filters, searchExact: true } as MaterialFilterState;
              setFilters(newFilters);
              onFilterChange(newFilters);
              setSuggestions([]);
            }}
            className="px-4 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition"
          >
            Buscar
          </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center gap-2 text-gray-200 hover:bg-[#222] transition"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-red-300 hover:bg-red-900/30 rounded-lg flex items-center gap-2 transition"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-[#333] pt-4 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {/* Category details: show types in this category */}
            {filters.categoryId && (
              <div className="mt-3 bg-[#0f0f0f] border border-[#222] rounded p-3">
                <h4 className="text-sm text-gray-300 font-semibold mb-2">Product types in this category</h4>
                {loadingTypes && <p className="text-gray-400 text-sm">Loading...</p>}
                {typesError && <p className="text-red-400 text-sm">{typesError}</p>}
                {!loadingTypes && !typesError && types.length === 0 && (
                  <p className="text-gray-400 text-sm">No products found for this category.</p>
                )}
                {!loadingTypes && types.length > 0 && (
                  <ul className="space-y-2 max-h-48 overflow-auto">
                    {types.map((t) => (
                      <li key={t._id} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-white font-medium">{t.name}</div>
                          {t.description && (
                            <div className="text-xs text-gray-400">{t.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-200">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(t.pricePerDay)}</div>
                          {t.replacementCost !== undefined && (
                            <div className="text-xs text-gray-400">Replacement: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(t.replacementCost)}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Min Price
              </label>
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceChange("min", parseFloat(e.target.value))}
                min="0"
                step="10"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceChange("max", parseFloat(e.target.value))}
                min="0"
                step="10"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
