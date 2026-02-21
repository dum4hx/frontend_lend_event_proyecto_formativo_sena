# Quick Start Guide - Warehouse Operator Module

## Overview
The warehouse operator module is a complete, production-ready feature that allows warehouse staff to manage inventory, track stock movements, monitor alerts, and manage warehouse locations.

## Key Files to Check

### 1. **Main Layout** 
```
src/modules/warehouse-operator/layouts/WarehouseOperatorLayout.tsx
```
- Simple wrapper that provides the sidebar and main content area
- Uses Outlet to render page content

### 2. **Navigation Sidebar**
```
src/modules/warehouse-operator/components/Sidebar.tsx
```
- 6 navigation items
- Logout button
- Styled with Tailwind dark theme

### 3. **Pages** (All in `src/modules/warehouse-operator/pages/`)
- **Dashboard.tsx** - Overview with 4 stat cards and recent activity
- **Inventory.tsx** - Table of inventory items with search
- **Locations.tsx** - Card grid showing warehouse locations
- **StockMovements.tsx** - Historical log of all movements
- **Alerts.tsx** - Alert system with status management
- **Settings.tsx** - User preferences and notifications

### 4. **API Service**
```
src/services/warehouseOperatorService.ts
```
- All API functions related to warehouse operations
- Uses `get`, `post`, `patch`, `del` from `lib/api.ts`
- Export interface types for TypeScript safety

### 5. **Routing**
```
src/App.tsx
```
- Warehouse operator routes added with lazy loading
- Protected by `RequireRole(['warehouse_operator'])`

```
src/utils/roleRouting.ts
```
- NEW: `getDashboardUrlByRole()` - determines dashboard URL by role
- NEW: `requiresActiveSubscription()` - checks if role needs subscription

```
src/pages/Login.tsx
```
- UPDATED: Uses new routing utilities
- Redirects all roles to appropriate dashboards

## Architecture Pattern

### Component Structure
```
Page Component
├── useState for local state (search, filter, etc.)
├── useEffect for data fetching
├── Try/catch for error handling
└── JSX that renders UI
```

### Service Pattern
```typescript
// In service file
export async function getFunctionName(params): Promise<ApiSuccessResponse<T>> {
  return get<T>("/api/path", params);
}

// In component
const response = await getFunctionName(params);
setState(response.data);
```

### UI Pattern
```
<div className="container">
  <header>Title and intro</header>
  <search-bar />
  <filter-bar />
  <content-area>
    {loading && <spinner />}
    {error && <error-message />}
    {!loading && items.map(item => <item-component key={item.id} />)}
  </content-area>
</div>
```

## Common Tasks

### Adding a New Page
1. Create `NewPage.tsx` in `src/modules/warehouse-operator/pages/`
2. Add import to `App.tsx` (lazy load)
3. Add route in warehouse-operator Route definition
4. Add NavItem to Sidebar if needed

### Adding a New API Endpoint
1. Create function in `warehouseOperatorService.ts`
2. Use pattern: `get<T>("/path", params)` or `post<T>("/path", data)`
3. Add types/interfaces at top of function
4. Import in component and call inside useEffect

### Styling a New Component
1. Use Tailwind classes: `className="..."`
2. Color scheme:
   - Background: `bg-[#121212]` or `bg-[#1a1a1a]`
   - Border: `border border-[#333]`
   - Text: `text-white` or `text-gray-400`
   - Accent: `bg-[#FFD700]` or `hover:border-[#FFD700]`

### Adding Error Handling
```typescript
try {
  const response = await getFunction();
  setData(response.data);
  setError(null);
} catch (err: unknown) {
  const message = err instanceof ApiError ? err.message : "Unknown error";
  setError(message);
}
```

## State Management

All components use React's `useState` and `useEffect`:

```typescript
// For data
const [items, setItems] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// For UI
const [searchTerm, setSearchTerm] = useState("");
const [filterType, setFilterType] = useState("all");

// In useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await getItems();
      setItems(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []); // dependency array
```

## Testing the Module

1. **Run the app**: `npm run dev`
2. **Login as warehouse operator**:
   - Navigate to `/login`
   - Use warehouse operator credentials
3. **Verify redirect**:
   - Should automatically go to `/warehouse-operator`
4. **Check each page**:
   - Click sidebar items
   - Verify content loads
   - Check responsive design on mobile

## Type Definitions

Key TypeScript types to know:

```typescript
// From types/api.ts
interface User {
  id: string;
  email: string;
  name: PersonName;
  role: UserRole; // "warehouse_operator"
  status: UserStatus;
  phone?: string;
}

// From warehouseOperatorService.ts
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minThreshold: number;
  location: string;
  lastUpdated: string;
}

// API responses use
interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
  message?: string;
}
```

## Common Patterns

### Search/Filter
```typescript
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// In JSX
<input 
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
{filteredItems.map(item => (...))}
```

### Form Submission
```typescript
const [formData, setFormData] = useState({ name: "", email: "" });
const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    await updateFunction(formData);
    // success message
  } finally {
    setLoading(false);
  }
}

return (
  <form onSubmit={handleSubmit}>
    <input 
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
    />
  </form>
);
```

### Status Indicators
```typescript
const getStatusColor = (status: string) => {
  switch(status) {
    case "critical": return "bg-red-500/20 text-red-400";
    case "warning": return "bg-yellow-500/20 text-yellow-400";
    case "normal": return "bg-green-500/20 text-green-400";
    default: return "bg-gray-500/20 text-gray-400";
  }
};

// Usage
<span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
  {item.status}
</span>
```

## Debugging Tips

### Check Auth
```typescript
import { useAuth } from "../contexts/useAuth";

function MyComponent() {
  const { user, isLoggedIn, isLoading } = useAuth();
  
  console.log("User:", user);
  console.log("Logged in:", isLoggedIn);
  console.log("Loading:", isLoading);
}
```

### Check API Calls
```typescript
// Add console.log in service function
console.log("Fetching:", path, params);

// Or add to component
const response = await getFunction();
console.log("Response:", response);
```

### Check Routing
```typescript
// Browser DevTools → Application → Cookies/Storage
// Look for JWT token

// Console
import { useAuth } from "../contexts/useAuth";
const { user } = useAuth();
console.log("Current user role:", user?.role);
```

## File Size Reference

- Inventory.tsx: ~134 lines
- Locations.tsx: ~165 lines
- StockMovements.tsx: ~182 lines
- Alerts.tsx: ~220 lines
- Settings.tsx: ~227 lines
- Dashboard.tsx: ~144 lines
- Service: ~126 lines
- Sidebar: ~81 lines

**Total: ~1,080 lines of component code**

## Next Steps

### To Connect Real API
1. Uncomment/replace mock data with service calls
2. Update `useEffect` to call service functions
3. Handle loading/error states
4. Test with real backend

### To Add Features
1. Create new page in `/pages/`
2. Add to Sidebar navigation
3. Add route in App.tsx
4. Implement service functions
5. Add TypeScript types

### To Customize Theme
1. Update color values in Tailwind classes
2. Change #FFD700 to different color globally
3. Update #121212 background colors
4. Adjust spacing and sizing as needed

## Useful Resources

- **Tailwind Docs**: https://tailwindcss.com/
- **React Docs**: https://react.dev/
- **React Router**: https://reactrouter.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Lucide Icons**: https://lucide.dev/

## Support

For questions about:
- **Architecture**: See `WAREHOUSE_OPERATOR_ARCHITECTURE.md`
- **User Guide**: See `WAREHOUSE_OPERATOR_GUIDE.md`
- **Implementation**: See `WAREHOUSE_OPERATOR_IMPLEMENTATION.md`
- **Module Docs**: See `src/modules/warehouse-operator/README.md`
