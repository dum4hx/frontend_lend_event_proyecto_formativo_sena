import React from "react";
import { SearchInput, SearchableSelect, type SelectOption } from "../../../../../components/ui";
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
  /** Currently selected location ID (empty string = all). */
  locationId: string;
  /** Called when location filter changes. */
  onLocationChange: (locationId: string) => void;
  /** Available locations for the dropdown. */
  locationOptions: SelectOption[];
}

/**
 * CatalogFilters — Search input + category + location dropdowns for filtering
 * the catalog overview table. Dark neon styling.
 */
export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  locationId,
  onLocationChange,
  locationOptions,
}) => {
  const categoryOptions: SelectOption[] = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat._id, label: cat.name })),
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search material types…"
        className="w-full md:w-80"
      />

      <SearchableSelect
        options={categoryOptions}
        value={categoryId}
        onChange={onCategoryChange}
        placeholder="All Categories"
        className="w-full md:w-56"
      />

      <SearchableSelect
        options={[{ value: "", label: "All Locations" }, ...locationOptions]}
        value={locationId}
        onChange={onLocationChange}
        placeholder="All Locations"
        className="w-full md:w-56"
      />
    </div>
  );
};
