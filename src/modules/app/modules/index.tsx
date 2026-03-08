// Material Modules - Using new three-module structure
// Categories: GET, POST, DELETE only (backend limitation)
// Types (Catalog): Full CRUD implementation
// Instances (Inventory): Full CRUD with status management

export { CategoryCatalog as MaterialCategoriesModule } from "./material-categories/pages/CategoryCatalog";
export { MaterialTypeCatalog as MaterialTypesModule } from "./material-types/pages/MaterialTypeCatalog";
export { MaterialInstanceCatalog as MaterialInstancesModule } from "./material-instances/pages/MaterialInstanceCatalog";
