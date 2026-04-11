/**
 * Centralized feature-flag registry.
 *
 * Flip a flag to `true` to re-enable the corresponding feature.
 * Flags that are `false` ensure the related UI is never rendered
 * (zero DOM footprint, no event handlers registered).
 */
export const FEATURE_FLAGS = {
  /**
   * Bulk data-import from Excel/CSV files.
   *
   * Affects: Material Categories, Material Types, Material Instances,
   * and Warehouse Locations import buttons & modals.
   *
   * Set to `false` as technical debt — the feature will be revisited
   * in a future sprint.
   */
  ENABLE_DATA_IMPORT: false,
} as const;
