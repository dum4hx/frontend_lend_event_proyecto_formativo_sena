import React from "react";
import { SearchInput } from "../../../../../components/ui";
import type { MaterialCategory } from "../../../../../types/api";

interface CatalogFiltersProps {
  /** Current search term. */
  search: string;
  /** Called when search changes (debounced internally by SearchInput). */
  onSearchChange: (value: string) => void;
  /** Currently selected category ID (empty string = all). */
  categoryId: string;
  /** Called when category filter changes. */
  onCategoryChange: (categoryId: string) => void;
  /** Available categories for the dropdown. */
  categories: MaterialCategory[];
}

/**
 * CatalogFilters — Search input + category dropdown for filtering
 * the catalog overview table. Dark neon styling.
 */
export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search material types…"
        className="w-full md:w-80"
      />

      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-10 px-3 bg-[#121212] border border-[#222] rounded-lg text-sm text-white
          focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20
          transition-all"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
};
