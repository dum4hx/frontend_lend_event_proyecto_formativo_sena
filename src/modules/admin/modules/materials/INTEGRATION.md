/**
 * Materials Module - MongoDB & API Integration Guide
 * ====================================================
 * 
 * This document explains how the Materials module integrates with MongoDB
 * and the REST API layer for full CRUD operations.
 * 
 * ## Architecture Overview
 * 
 * ```
 * Client (Materials Module)
 *         ↓
 *   React Components & Hooks
 *         ↓
 *   API Client Layer (src/lib/api.ts)
 *         ↓
 *   Service Layer (src/services/materialService.ts)
 *         ↓
 *   REST API Endpoints
 *         ↓
 *   Backend (Node.js / Express / MongoDB)
 *         ↓
 *   MongoDB Collections
 * ```
 * 
 * ## Data Flow
 * 
 * ### Creating a Material
 * ```
 * User fills MaterialForm
 *   → Click "Create Material"
 *   → handleSubmit() validation
 *   → createMaterial(payload) hook called
 *   → materialService.createMaterialType(payload)
 *   → POST /materials/types with payload
 *   → API validates and inserts into MongoDB
 *   → Returns created material with _id
 *   → UI updates with new material
 *   → Shows success message
 * ```
 * 
 * ### Loading Materials
 * ```
 * Component mounts (CreateMaterial/MaterialCatalog)
 *   → useMaterials() hook initializes
 *   → useEffect triggers fetchMaterials()
 *   → materialService.getMaterialTypes()
 *   → GET /materials/types?[filters]
 *   → API queries MongoDB
 *   → Returns array of MaterialType objects
 *   → Hook state updated with materials
 *   → Components re-render with data
 * ```
 * 
 * ### Filtering Materials (Client-Side)
 * ```
 * User modifies filters
 *   → onFilterChange(newFilters)
 *   → Filter state updated
 *   → Materials array filtered client-side
 *   → fingeredMaterials computed
 *   → MaterialList re-renders with filtered data
 * 
 * Note: Current implementation does client-side filtering.
 * For large datasets, implement server-side filtering:
 *   GET /materials/types?search=name&categoryId=cat_123&minPrice=10&maxPrice=100
 * ```
 * 
 * ## API Service Layer
 * 
 * ### src/services/materialService.ts Functions
 * 
 * #### Categories
 * ```typescript
 * // Get all categories
 * getMaterialCategories(): Promise<{ categories: MaterialCategory[] }>
 * 
 * // Create new category
 * createMaterialCategory(
 *   payload: CreateMaterialCategoryPayload
 * ): Promise<{ category: MaterialCategory }>
 * ```
 * 
 * #### Material Types (Catalog Items)
 * ```typescript
 * // List with optional filters
 * getMaterialTypes(
 *   params?: MaterialTypesQueryParams
 * ): Promise<{ materialTypes: MaterialType[] }>
 * 
 * // Create new type
 * createMaterialType(
 *   payload: CreateMaterialTypePayload
 * ): Promise<{ materialType: MaterialType }>
 * ```
 * 
 * #### Material Instances (Individual Items)
 * ```typescript
 * // List instances
 * getMaterialInstances(
 *   params?: MaterialInstancesQueryParams
 * ): Promise<{ instances: MaterialInstance[] }>
 * 
 * // Create instance
 * createMaterialInstance(
 *   payload: CreateMaterialInstancePayload
 * ): Promise<{ instance: MaterialInstance }>
 * 
 * // Update instance status
 * updateMaterialInstanceStatus(
 *   instanceId: string,
 *   payload: UpdateMaterialInstanceStatusPayload
 * ): Promise<{ instance: MaterialInstance }>
 * ```
 * 
 * ## HTTP Request/Response Examples
 * 
 * ### Create Material Type Request
 * ```
 * POST /materials/types
 * Content-Type: application/json
 * Authorization: Bearer <token>
 * 
 * {
 *   "categoryId": "cat_507f1f77bcf86cd799439011",
 *   "name": "Aluminum Frame 10x10",
 *   "sku": "ALU-FRAME-10x10",
 *   "unitCost": 45.50,
 *   "unitPrice": 89.99,
 *   "description": "Lightweight aluminum frame for display stands",
 *   "dimensions": {
 *     "length": 10,
 *     "width": 10,
 *     "height": 2,
 *     "unit": "cm"
 *   },
 *   "weight": 2.5,
 *   "weightUnit": "kg"
 * }
 * ```
 * 
 * ### Create Material Type Response
 * ```json
 * {
 *   "status": "success",
 *   "data": {
 *     "materialType": {
 *       "_id": "mat_507f1f77bcf86cd799439012",
 *       "organizationId": "org_507f1f77bcf86cd799439013",
 *       "categoryId": "cat_507f1f77bcf86cd799439011",
 *       "name": "Aluminum Frame 10x10",
 *       "sku": "ALU-FRAME-10x10",
 *       "unitCost": 45.50,
 *       "unitPrice": 89.99,
 *       "description": "Lightweight aluminum frame for display stands",
 *       "dimensions": {
 *         "length": 10,
 *         "width": 10,
 *         "height": 2,
 *         "unit": "cm"
 *       },
 *       "weight": 2.5,
 *       "weightUnit": "kg",
 *       "createdBy": "user_507f1f77bcf86cd799439014",
 *       "createdAt": "2024-01-15T10:30:00Z",
 *       "updatedAt": "2024-01-15T10:30:00Z"
 *     }
 *   },
 *   "message": "Material type created successfully"
 * }
 * ```
 * 
 * ### List Materials Request
 * ```
 * GET /materials/types?page=1&limit=20&categoryId=cat_507f...
 * Authorization: Bearer <token>
 * ```
 * 
 * ### List Materials Response
 * ```json
 * {
 *   "status": "success",
 *   "data": {
 *     "materialTypes": [
 *       {
 *         "_id": "mat_507f...",
 *         "categoryId": "cat_507f...",
 *         "name": "Aluminum Frame",
 *         "sku": "ALU-001",
 *         "unitCost": 45.50,
 *         "unitPrice": 89.99,
 *         ...
 *       }
 *     ],
 *     "total": 45,
 *     "page": 1,
 *     "totalPages": 3
 *   }
 * }
 * ```
 * 
 * ## MongoDB Collections Schema
 * 
 * ### materials_categories
 * ```javascript
 * {
 *   _id: ObjectId,
 *   organizationId: ObjectId,
 *   name: String,
 *   description: String,
 *   icon: String,
 *   color: String,
 *   sortOrder: Number,
 *   createdAt: DateTime,
 *   updatedAt: DateTime,
 *   deletedAt: DateTime (soft delete)
 * }
 * ```
 * 
 * ### materials_types
 * ```javascript
 * {
 *   _id: ObjectId,
 *   organizationId: ObjectId,
 *   categoryId: ObjectId (ref: materials_categories),
 *   name: String,
 *   sku: String (unique per organization),
 *   unitCost: Decimal,
 *   unitPrice: Decimal,
 *   description: String,
 *   dimensions: {
 *     length: Number,
 *     width: Number,
 *     height: Number,
 *     unit: String (cm, m, inches, feet)
 *   },
 *   weight: Number,
 *   weightUnit: String (kg, g, lb),
 *   images: [String] (URLs),
 *   tags: [String],
 *   attributes: Map (custom fields),
 *   active: Boolean,
 *   createdBy: ObjectId (ref: users),
 *   createdAt: DateTime,
 *   updatedAt: DateTime,
 *   deletedAt: DateTime (soft delete)
 * }
 * ```
 * 
 * ### materials_instances
 * ```javascript
 * {
 *   _id: ObjectId,
 *   organizationId: ObjectId,
 *   materialTypeId: ObjectId (ref: materials_types),
 *   locationId: ObjectId (ref: locations),
 *   serialNumber: String,
 *   status: String (available, in_use, maintenance, damaged, retired),
 *   purchaseDate: DateTime,
 *   lastMaintenanceDate: DateTime,
 *   notes: String,
 *   condition: String (excellent, good, fair, poor),
 *   createdAt: DateTime,
 *   updatedAt: DateTime,
 *   deletedAt: DateTime (soft delete)
 * }
 * ```
 * 
 * ## API Error Handling
 * 
 * The module handles API errors gracefully:
 * 
 * ```typescript
 * // In components and hooks
 * try {
 *   const response = await createMaterialType(payload);
 *   // Success - update UI
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     // Handle API error
 *     console.error('API Error:', error.message, error.code);
 *   } else {
 *     // Handle network error
 *     console.error('Network Error:', error);
 *   }
 * }
 * ```
 * 
 * ### Common Error Codes
 * - `BAD_REQUEST` - Invalid payload
 * - `VALIDATION_ERROR` - Field validation failed
 * - `UNAUTHORIZED` - Token invalid/expired
 * - `FORBIDDEN` - User lacks permissions
 * - `NOT_FOUND` - Resource doesn't exist
 * - `CONFLICT` - SKU already exists
 * - `PLAN_LIMIT_REACHED` - Organization limit exceeded
 * - `RATE_LIMIT_EXCEEDED` - Too many requests
 * - `INTERNAL_ERROR` - Server error
 * 
 * ## Optimization Tips
 * 
 * ### 1. Implement Server-Side Pagination
 * Current: Client-side filtering only
 * Better: Use API query parameters
 * ```typescript
 * getMaterialTypes({ 
 *   page: 1, 
 *   limit: 20,
 *   search: 'aluminum',
 *   categoryId: 'cat_123',
 *   minPrice: 10,
 *   maxPrice: 100
 * })
 * ```
 * 
 * ### 2. Add Caching
 * Implement React Query or SWR for automatic caching:
 * ```typescript
 * import { useQuery } from '@tanstack/react-query';
 * 
 * const { data, isLoading } = useQuery({
 *   queryKey: ['materials'],
 *   queryFn: () => materialService.getMaterialTypes()
 * });
 * ```
 * 
 * ### 3. Implement Optimistic Updates
 * Update UI before API response for better UX
 * 
 * ### 4. Add Material Images/Attachments
 * Extend MaterialType with image URLs for better visualization
 * 
 * ### 5. Implement Soft Deletes
 * Current delete is hard delete; consider soft delete with restoration
 * 
 * ## Security Considerations
 * 
 * - All API requests include Authorization header with JWT token
 * - Organization isolation enforced at API level
 * - User permissions checked for material operations
 * - Sensitive data (costs) should be role-restricted
 * - API implements rate limiting and CORS policies
 * 
 * ## Integration with Other Modules
 * 
 * ### Warehouse Operator Module
 * Can use this module's materials for:
 * - Inventory tracking
 * - Stock movements
 * - Location assignment
 * 
 * ### Commercial Advisor Module
 * Can use materials for:
 * - Package/bundle creation
 * - Pricing calculations
 * - Rental/lease offerings
 * 
 * ### Location Manager Module
 * Already has its own Materials page but can:
 * - Reference these materials
 * - Use material types for locations
 * - Share category structure
 * 
 * ## Environment Configuration
 * 
 * The API base URL is configured via environment variable:
 * ```
 * VITE_API_BASE_URL = http://api.test.local/api/v1
 * ```
 * 
 * Endpoints are relative to this base, e.g.:
 * ```
 * POST ${VITE_API_BASE_URL}/materials/types
 * ```
 * 
 * ## Debugging
 * 
 * Enable verbose logging in development:
 * ```typescript
 * // In src/lib/api.ts
 * if (process.env.NODE_ENV === 'development') {
 *   console.log('API Request:', method, url, body);
 *   console.log('API Response:', status, data);
 * }
 * ```
 * 
 * ## Troubleshooting
 * 
 * ### Materials not loading
 * - Check CORS headers in browser console
 * - Verify API_BASE_URL is correct
 * - Check Authorization token validity
 * - Check organization permissions
 * 
 * ### Create request fails
 * - Validate required fields (categoryId, name, sku)
 * - Check SKU uniqueness (per organization)
 * - Verify categoryId exists
 * - Check plan limits (maxCatalogItems)
 * 
 * ### MongoDB connection issues
 * - Check MongoDB connection string
 * - Verify database and collection exist
 * - Check user/password credentials
 * - Verify network connectivity
 * 
 * ## Future API Features
 * 
 * - [ ] Batch operations (import/export)
 * - [ ] Advanced search with Elasticsearch
 * - [ ] Material versioning/audit trail
 * - [ ] Custom field support
 * - [ ] Image/attachment storage
 * - [ ] Material relationships/dependencies
 * - [ ] Pricing history tracking
 * - [ ] Auto-generated SKU
 * - [ ] Barcode support
 * - [ ] Integration with warehouse systems
 * 
 */

export const MONGO_INTEGRATION_GUIDE = true;
