/**
 * Materials Module
 * ==================
 * 
 * Independent submodule within the Admin module for managing material catalog.
 * This module is completely self-contained and can be maintained independently.
 * 
 * ## Module Structure
 * 
 * ```
 * src/modules/admin/modules/materials/
 * ├── components/          # Reusable components
 * │   ├── MaterialForm.tsx         # Form for creating/editing materials
 * │   ├── MaterialList.tsx         # Table component for displaying materials
 * │   ├── MaterialFilters.tsx      # Advanced filtering UI
 * │   ├── MaterialDetailModal.tsx  # Modal for viewing material details
 * │   └── index.ts                 # Component exports
 * ├── pages/              # Page-level components
 * │   ├── CreateMaterial.tsx       # Page with form and recent materials
 * │   ├── MaterialCatalog.tsx      # Browsable catalog view
 * │   └── index.ts                 # Page exports
 * ├── hooks/              # Custom React hooks
 * │   ├── useMaterials.ts          # Hook for materials CRUD operations
 * │   ├── useCategories.ts         # Hook for category management
 * │   └── index.ts                 # Hook exports
 * └── index.ts            # Main module export
 * ```
 * 
 * ## Features
 * 
 * ### Created
 * - ✅ Material creation form with validation
 * - ✅ Material list with sorting and pagination
 * - ✅ Advanced filtering (search, category, price range)
 * - ✅ Material detail modal view
 * - ✅ Profit margin calculation (unit price - unit cost)
 * - ✅ Markup percentage calculation
 * - ✅ Dimension and weight specifications
 * - ✅ MongoDB integration via REST API
 * - ✅ Two views: Catalog and Creation
 * 
 * ### Architecture Highlights
 * - **Independent**: Can be used anywhere in the admin module
 * - **Self-contained**: All dependencies are local to the module
 * - **Composable**: Components are small and reusable
 * - **Type-safe**: Full TypeScript support with proper typing
 * - **API-driven**: Integrates with existing REST API
 * - **Database**: Uses MongoDB through the backend API
 * 
 * ## API Integration
 * 
 * The module uses the following API endpoints (via `materialService.ts`):
 * 
 * ```typescript
 * // Categories
 * GET    /materials/categories              // List categories
 * POST   /materials/categories              // Create category
 * 
 * // Material Types (Catalog Items)
 * GET    /materials/types?[params]          // List with optional filters
 * POST   /materials/types                   // Create material type
 * 
 * // Material Instances
 * GET    /materials/instances?[params]      // List instances
 * POST   /materials/instances               // Create instance
 * PATCH  /materials/instances/:id/status    // Update status
 * ```
 * 
 * ## Data Types
 * 
 * Key types from `src/types/api.ts`:
 * 
 * ```typescript
 * interface MaterialCategory {
 *   _id: string;
 *   name: string;
 * }
 * 
 * interface MaterialType {
 *   _id: string;
 *   categoryId: string;
 *   name: string;
 *   sku: string;
 *   unitCost: number;
 *   unitPrice: number;
 *   description?: string;
 *   dimensions?: {
 *     length: number;
 *     width: number;
 *     height: number;
 *     unit: string;
 *   };
 *   weight?: number;
 *   weightUnit?: string;
 * }
 * 
 * interface CreateMaterialTypePayload {
 *   categoryId: string;
 *   name: string;
 *   sku: string;
 *   unitCost: number;
 *   unitPrice: number;
 *   description?: string;
 *   dimensions?: { ... };
 *   weight?: number;
 *   weightUnit?: string;
 * }
 * ```
 * 
 * ## Usage
 * 
 * ### Importing the Module
 * 
 * ```typescript
 * import { MaterialsModule } from './modules/materials';
 * // or individual components/pages
 * import { MaterialForm, MaterialList } from './modules/materials/components';
 * import { CreateMaterialPage } from './modules/materials/pages';
 * ```
 * 
 * ### Using Hooks
 * 
 * ```typescript
 * import { useMaterials, useCategories } from './modules/materials/hooks';
 * 
 * function MyComponent() {
 *   const { materials, loading, error, createMaterial, refreshMaterials } = useMaterials();
 *   const { categories } = useCategories();
 *   
 *   return (
 *     // Your component JSX
 *   );
 * }
 * ```
 * 
 * ### Route Integration
 * 
 * The module is integrated in `src/App.tsx`:
 * 
 * ```typescript
 * <Route path="/admin/materials" element={<Materials />} />
 * ```
 * 
 * Navigation is available in the Admin sidebar with the Package icon.
 * 
 * ## Component Descriptions
 * 
 * ### MaterialForm.tsx
 * Form component for creating new materials. Features:
 * - Field validation
 * - Dimension input
 * - Weight specification
 * - Cost vs. Price comparison
 * - Error handling and feedback
 * 
 * ### MaterialList.tsx
 * Table component displaying material catalog. Features:
 * - Sortable columns
 * - Action menu (Edit, View, Delete)
 * - Profit margin color coding (green positive, red negative)
 * - Empty state handling
 * 
 * ### MaterialFilters.tsx
 * Advanced filtering system with:
 * - Full-text search (name, SKU)
 * - Category filtering
 * - Price range slider
 * - Filter state management
 * - Reset functionality
 * 
 * ### MaterialDetailModal.tsx
 * Detailed view of a material including:
 * - All specifications
 * - Profit calculations
 * - Dimensions and weight
 * - Metadata (creation date, etc.)
 * 
 * ## Hooks Documentation
 * 
 * ### useMaterials()
 * Manages material CRUD operations:
 * 
 * ```typescript
 * const {
 *   materials,          // MaterialType[]
 *   loading,            // boolean
 *   error,              // string | null
 *   createMaterial,     // (payload) => Promise<void>
 *   refreshMaterials    // () => Promise<void>
 * } = useMaterials();
 * ```
 * 
 * ### useCategories()
 * Manages material categories:
 * 
 * ```typescript
 * const {
 *   categories,         // MaterialCategory[]
 *   loading,            // boolean
 *   error,              // string | null
 *   refreshCategories   // () => Promise<void>
 * } = useCategories();
 * ```
 * 
 * ## Future Enhancements
 * 
 * - [ ] Material editing (update existing materials)
 * - [ ] Material deletion with confirmation
 * - [ ] Bulk operations (import/export)
 * - [ ] Material images/attachments
 * - [ ] Inventory tracking integration
 * - [ ] Material history/audit log
 * - [ ] Custom fields support
 * - [ ] Category management UI
 * 
 * ## Database
 * 
 * The module uses MongoDB with the following collections:
 * - `materials_categories` - Material categories
 * - `materials_types` - Material catalog/types
 * - `materials_instances` - Individual material items
 * 
 * Data is accessed through the REST API endpoints defined in `materialService.ts`.
 * 
 * ## Styling
 * 
 * The module uses Tailwind CSS for styling. Key color scheme:
 * - Primary: Blue (#3B82F6)
 * - Accent: Gold (#FFD700) - matches admin theme
 * - Success: Green (#10B981)
 * - Danger: Red (#EF4444)
 * - Background: White/Gray scale
 * 
 * ## Error Handling
 * 
 * All components include proper error handling:
 * - API errors are caught and displayed
 * - Form validation provides user feedback
 * - Loading states prevent multiple submissions
 * - Fallback UI for edge cases
 * 
 * ## Performance Considerations
 * 
 * - Materials are loaded once on component mount
 * - Filtering happens client-side for speed
 * - Modal details don't require additional API calls
 * - Components use React.memo for optimization (future enhancement)
 * 
 * ## Testing
 * 
 * To test the module:
 * 1. Navigate to http://localhost:5173/admin/materials
 * 2. Click "New Material" to create a material
 * 3. Fill in the form and submit
 * 4. View the material in the catalog
 * 5. Use filters to search for materials
 * 6. Click on materials to view details
 * 
 * ## Contributing
 * 
 * When adding new features to this module:
 * 1. Keep components in the appropriate directory
 * 2. Update this documentation
 * 3. Maintain TypeScript typing
 * 4. Use existing API integration patterns
 * 5. Test with real MongoDB data
 * 
 */

export const MATERIALS_MODULE_README = true;
