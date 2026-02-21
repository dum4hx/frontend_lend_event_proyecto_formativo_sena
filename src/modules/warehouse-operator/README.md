# Warehouse Operator Module

## Overview

The Warehouse Operator module provides a dedicated interface for warehouse staff to manage inventory, locations, stock movements, and alerts. This role is designed specifically for employees who need visibility and control over warehouse operations without access to business management features.

## Features

### 1. Dashboard
- **Overview of warehouse metrics**:
  - Total items in inventory
  - Low stock alerts
  - Active warehouse locations
  - Stock movements today
- **Quick access to recent activities**:
  - Recent stock movements
  - Low stock items requiring attention

### 2. Inventory Management
- **View all inventory items** with details:
  - SKU and item names
  - Current quantities
  - Minimum thresholds
  - Current location
  - Last updated timestamp
- **Status indicators**:
  - Critical (below 20% of minimum)
  - Low (below minimum threshold)
  - Normal (healthy stock levels)
- **Search and filter** capabilities

### 3. Location Management
- **View warehouse locations** with:
  - Location codes (A1, B2, etc.)
  - Section and shelf information
  - Capacity and occupancy tracking
  - Status (available, full, maintenance)
  - Real-time capacity percentage
- **Location card view** with visual capacity bars

### 4. Stock Movements
- **Track all inventory movements**:
  - Inbound (purchases, returns)
  - Outbound (shipments, customer orders)
  - Transfers (between locations)
  - Adjustments (count corrections, damage)
- **Filter by movement type**
- **View detailed information**:
  - Item details
  - Location changes
  - Operator information
  - Movement reasons
  - Timestamp

### 5. Alerts & Notifications
- **Real-time alert system**:
  - Critical alerts (requires immediate action)
  - Warnings (should be addressed)
  - Information (general notifications)
- **Alert management**:
  - Mark as acknowledged
  - Resolve completed alerts
  - Track alert status
- **Alert types**:
  - Critical stock levels
  - Count discrepancies
  - Location capacity warnings
  - Scheduled maintenance

### 6. Settings
- **Personal preferences**:
  - Update name and contact information
  - Language selection
  - Phone number management
- **Notification preferences**:
  - Low stock alerts
  - Critical stock alerts
  - Stock movement notifications
  - Email notification settings

## Role Protection

All warehouse operator routes are protected by the `RequireRole` guard, ensuring only users with the `warehouse_operator` role can access:

```
/warehouse-operator          - Dashboard
/warehouse-operator/inventory        - Inventory management
/warehouse-operator/locations        - Location management
/warehouse-operator/stock-movements  - Stock movement history
/warehouse-operator/alerts           - Alerts and notifications
/warehouse-operator/settings         - User settings
```

## API Integration

The module uses the `warehouseOperatorService.ts` which provides:

### Inventory Endpoints
- `GET /warehouse/inventory` - List all items
- `GET /warehouse/inventory/:id` - Get specific item
- `PUT /warehouse/inventory/:id` - Update item
- `DELETE /warehouse/inventory/:id` - Delete item

### Location Endpoints
- `GET /warehouse/locations` - List all locations
- `GET /warehouse/locations/:id` - Get specific location
- `POST /warehouse/locations` - Create location
- `PUT /warehouse/locations/:id` - Update location
- `DELETE /warehouse/locations/:id` - Delete location

### Stock Movement Endpoints
- `GET /warehouse/stock-movements` - List movements
- `POST /warehouse/stock-movements` - Record new movement

### Alert Endpoints
- `GET /warehouse/alerts` - List alerts
- `PUT /warehouse/alerts/:id/acknowledge` - Acknowledge alert
- `PUT /warehouse/alerts/:id/resolve` - Resolve alert

### Dashboard Endpoints
- `GET /warehouse/dashboard/stats` - Get dashboard statistics

## User Flow

1. **Invitation**: Admin sends workspace invitation to warehouse operator
2. **Activation**: Warehouse operator receives email with activation link
3. **Set Password**: Uses link to set password via `/accept-invite`
4. **Login**: Logs in with email and password
5. **Dashboard**: Automatically redirected to `/warehouse-operator` based on role
6. **Operations**: Can manage inventory, view alerts, and track movements

## Component Structure

```
src/modules/warehouse-operator/
├── components/
│   ├── Sidebar.tsx           - Navigation menu
│   ├── StatCard.tsx          - Metric card component
│   └── index.ts
├── layouts/
│   └── WarehouseOperatorLayout.tsx - Main layout wrapper
├── pages/
│   ├── Dashboard.tsx         - Overview page
│   ├── Inventory.tsx         - Inventory management
│   ├── Locations.tsx         - Location management
│   ├── StockMovements.tsx    - Movement history
│   ├── Alerts.tsx            - Alert management
│   └── Settings.tsx          - User settings
```

## Authentication & Authorization

- **Protected by**: `RequireRole` component with `warehouse_operator` role requirement
- **Fallback URL**: `/unauthorized` if user doesn't have required role
- **Login redirect**: After login, users are automatically sent to `/warehouse-operator` if they have the warehouse_operator role
- **Session check**: Uses `AuthContext` to verify user session on app load

## Styling

The module uses Tailwind CSS with a dark theme matching the admin module:
- Primary color: `#FFD700` (gold)
- Background: `#121212` (dark gray)
- Accent: `#1a1a1a` (darker gray)
- Text: White with gray variations

## Future Enhancements

Potential features to add:
- Bulk inventory operations
- Advanced reporting and analytics
- Barcode scanning integration
- Mobile app version
- Real-time notifications via WebSocket
- Audit trail for compliance
- Integration with external warehouse management systems
