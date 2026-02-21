# Warehouse Operator Setup Guide

## Overview

The warehouse operator role has been fully implemented as a new module in the application. This guide explains how to set up and invite warehouse operators to your organization.

## For Administrators (Business Owners)

### How to Invite a Warehouse Operator

1. **Navigate to Team Management**
   - Log in as the organization owner
   - Go to `/admin/team`
   - Look for the "Invite Staff" or similar button

2. **Fill in Invitation Details**
   - Enter the warehouse operator's email address
   - Select "Warehouse Operator" as the role
   - Click "Send Invitation"

3. **Invitation Email Sent**
   - An invitation email is automatically sent to the warehouse operator
   - The email contains an activation link with a token
   - Email format: `/accept-invite?email={email}&token={token}`

### Important Notes for Admins

- **Warehouse Operators do NOT require an active subscription** - They are support staff and can be added freely
- Each warehouse operator will have their own login credentials
- They can only access the warehouse operator dashboard and its sub-sections
- Their data is organized within your organization

## For Warehouse Operators

### Account Activation

1. **Receive Invitation Email**
   - Check your email for the invitation from the application
   - Click the activation link

2. **Set Your Password**
   - Go to the activation page (accessed via your email link)
   - Enter your desired password
   - Confirm your password
   - Password requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character

3. **Account Activated**
   - After successful activation, you'll be redirected to the login page
   - Log in with your email and password

### Your Dashboard

Once logged in, you'll automatically be directed to `/warehouse-operator` (the warehouse operator dashboard).

#### Available Sections

1. **Dashboard** (`/warehouse-operator`)
   - Overview of key metrics
   - Total items in inventory
   - Low stock alerts
   - Active locations
   - Recent stock movements
   - Low stock items

2. **Inventory** (`/warehouse-operator/inventory`)
   - Complete list of all warehouse items
   - View each item's:
     - SKU (Stock Keeping Unit)
     - Name and description
     - Current quantity
     - Minimum threshold
     - Current location
     - Last update time
     - Status indicator (Critical/Low/Normal)
   - Search items by SKU or name
   - Edit item details
   - Delete items (if authorized)
   - Add new items

3. **Locations** (`/warehouse-operator/locations`)
   - View all warehouse storage locations
   - Information includes:
     - Location code (A1, B2, C1, etc.)
     - Section and shelf
     - Capacity and occupancy
     - Current status
     - Percentage utilization
   - Visual capacity bars
   - Create new locations
   - Update location details
   - Delete locations (if empty)

4. **Stock Movements** (`/warehouse-operator/stock-movements`)
   - Historical record of all inventory movements
   - Movement types:
     - **Inbound**: Purchases or returns received
     - **Outbound**: Items shipped to customers
     - **Transfer**: Items moved between locations
     - **Adjustment**: Inventory count corrections
   - View details:
     - Item SKU and name
     - Quantity changed
     - From/to locations
     - Date and time
     - Operator name
     - Reason/note
   - Filter by movement type
   - Search by SKU, operator, or other details

5. **Alerts** (`/warehouse-operator/alerts`)
   - Real-time alert system for inventory issues
   - Alert types:
     - **Critical** (red): Immediate action needed
       - Critical stock levels
       - Serious discrepancies
     - **Warning** (yellow): Should be addressed soon
       - Low stock items
       - Location capacity issues
     - **Info** (blue): General notifications
   - Alert status tracking:
     - Active: New, unaddressed alerts
     - Acknowledged: Seen and being handled
     - Resolved: Issue completed
   - Actions available:
     - Acknowledge an alert
     - Mark as resolved

6. **Settings** (`/warehouse-operator/settings`)
   - Update personal information:
     - First name
     - Last name
     - Phone number
   - Language preferences
   - Notification settings:
     - Low stock alerts
     - Critical stock alerts
     - Stock movement notifications
     - Email notification preferences

## System Features

### Role-Based Access Control

- Warehouse operators can **ONLY** access their dashboard and sub-sections
- Attempting to access other sections (admin, super-admin, etc.) will:
  - Show a loading screen temporarily
  - Redirect to `/unauthorized`
  - Display the Unauthorized page

### Automatic Role-Based Routing

After login, users are automatically directed to their appropriate dashboard:
- `super_admin` → `/super-admin`
- `warehouse_operator` → `/warehouse-operator`
- `owner`, `manager`, `commercial_advisor` → `/admin`

### Authentication

- Sessions are managed via JWT tokens
- Tokens are automatically refreshed before expiring
- Session timeout: [depends on backend configuration]
- Logout clears all session data and returns to login page

## API Integration

The warehouse operator module uses dedicated API endpoints:

### Base URL
`/api/v1/warehouse/*`

### Endpoints Used

- `GET /warehouse/inventory` - List all items
- `GET /warehouse/inventory/:id` - Get item details
- `PATCH /warehouse/inventory/:id` - Update item
- `DELETE /warehouse/inventory/:id` - Delete item

- `GET /warehouse/locations` - List all locations
- `GET /warehouse/locations/:id` - Get location details
- `POST /warehouse/locations` - Create location
- `PATCH /warehouse/locations/:id` - Update location
- `DELETE /warehouse/locations/:id` - Delete location

- `GET /warehouse/stock-movements` - List movements
- `POST /warehouse/stock-movements` - Record new movement

- `GET /warehouse/alerts` - List alerts
- `PATCH /warehouse/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /warehouse/alerts/:id/resolve` - Resolve alert

- `GET /warehouse/dashboard/stats` - Get dashboard statistics

## Technical Details

### File Structure

```
src/
├── modules/warehouse-operator/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   └── index.ts
│   ├── layouts/
│   │   └── WarehouseOperatorLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Inventory.tsx
│   │   ├── Locations.tsx
│   │   ├── StockMovements.tsx
│   │   ├── Alerts.tsx
│   │   ├── Settings.tsx
│   │   └── [pages]
│   └── README.md
├── services/
│   └── warehouseOperatorService.ts
├── utils/
│   └── roleRouting.ts
└── App.tsx (updated with warehouse operator routes)
```

### Dependencies

- React hooks (useState, useEffect, useCallback)
- React Router (useNavigate, NavLink, Outlet)
- Lucide Icons for UI elements
- Tailwind CSS for styling
- Custom context: AuthContext
- Custom hooks: useAuth, useLogout

### Styling

- **Color Scheme**: Dark theme
  - Primary: Gold (#FFD700)
  - Background: #121212
  - Accent: #1a1a1a
- **Responsive**: Mobile-first design using Tailwind grid
- **Icons**: Lucide React icons

## Settings Structure

### User-Adjustable Settings

1. **Language**
   - English (en)
   - Spanish (es)
   - Portuguese (pt)

2. **Notifications**
   - Low Stock Alerts (boolean toggle)
   - Critical Stock Alerts (boolean toggle)
   - Stock Movement Notifications (boolean toggle)
   - Email Notifications (boolean toggle)

## Data Flow

```
1. User receives invite email
   ↓
2. Clicks activation link → /accept-invite?email=...&token=...
   ↓
3. Sets password and completes activation
   ↓
4. Redirected to /login
   ↓
5. Logs in with email and password
   ↓
6. Auth check completes
   ↓
7. getDashboardUrlByRole() routes to /warehouse-operator
   ↓
8. RequireRole guard verifies warehouse_operator role
   ↓
9. WarehouseOperatorLayout loads
   ↓
10. Dashboard content displays
```

## Troubleshooting

### User activated account but can't reach the dashboard

**Issue**: After login, user is redirected to `/unauthorized`

**Causes**:
- Role was not correctly set to `warehouse_operator` during invitation
- Token issue or session expired

**Solution**:
- Admin should verify the user's role in the system
- Have user log out and log back in
- Check browser console for any error messages

### Invitation email not received

**Causes**:
- Email bounced (invalid email address)
- Email filtered to spam
- SMTP configuration issue on backend

**Solution**:
- Verify email address is correct
- Re-send invitation
- Check email spam folder
- Check backend email service configuration

### Can't see inventory items

**Issue**: Inventory page loads but shows no items

**Answers**:
- No items have been created yet in the system
- API endpoint is not yet implemented on backend
- Permission issue

**Solution**:
- Admin should create test items
- Check if API endpoint `/warehouse/inventory` is implemented
- Check browser Network tab for API errors

## Future Enhancements

Planned features for future releases:
- Barcode scanning for quick inventory updates
- Mobile app for warehouse floor operations
- Real-time notifications via WebSocket
- Advanced analytics and reporting
- Integration with external warehouse management systems
- Bulk operations (import/export)
- Audit trail for compliance
- Two-factor authentication
