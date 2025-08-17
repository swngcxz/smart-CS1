# Activity Logs System - Complete Guide

This document explains how to use and display activity logs in both the staff and admin sections of the smart waste management system.

## Overview

The activity logs system tracks all user activities, bin operations, task assignments, and system events. It provides two different views:

1. **Staff View**: Shows only the logged-in user's activities
2. **Admin View**: Shows all activities across the system with filtering capabilities

## Backend API Endpoints

### Activity Logs Routes (`/api`)

- `POST /api/activitylogs` - Save a new activity log
- `GET /api/activitylogs` - Get all activity logs (admin view)
- `GET /api/activitylogs/:userId` - Get activity logs for a specific user
- `POST /api/task-assignments` - Save task assignments
- `GET /api/activity/daily-summary` - Get daily activity summary

### Activity Log Data Structure

```javascript
{
  user_id: string,           // ID of the user who performed the action
  bin_id: string,            // ID of the bin involved (if applicable)
  bin_location: string,      // Location of the bin
  bin_status: string,        // Current status of the bin
  bin_level: number,         // Waste level percentage
  assigned_janitor_id: string,    // ID of assigned janitor
  assigned_janitor_name: string,  // Name of assigned janitor
  task_note: string,         // Additional notes about the task
  activity_type: string,     // Type of activity (e.g., "task_assignment", "bin_emptied")
  timestamp: string,         // ISO timestamp of the activity
  date: string,              // Date in YYYY-MM-DD format
  time: string               // Time in HH:MM:SS format
}
```

## Frontend Implementation

### 1. Staff Activity Logs (`StaffActivityLogs.tsx`)

**Location**: `client/src/pages/staff/pages/StaffActiviyLogs.tsx`

**Features**:
- Displays only the logged-in user's activities
- Table format with columns: Time, Activity, Type, Details, Status
- Color-coded activity type badges
- Responsive design with proper loading states

**Usage**:
```tsx
import { StaffActivityLogs } from "@/pages/staff/pages/StaffActiviyLogs";

// In your staff dashboard
<StaffActivityLogs />
```

**Data Source**: Uses `useActivityLogs` hook to fetch user-specific logs

### 2. Admin Activity Logs (`ActivityLogs.tsx`)

**Location**: `client/src/pages/admin/pages/ActivityLogs.tsx`

**Features**:
- Displays all system activities
- Filtering by activity type
- Card-based layout with detailed information
- Total count display
- Color-coded activity type badges
- Responsive design with proper loading states

**Usage**:
```tsx
import { ActivityLogs } from "@/pages/admin/pages/ActivityLogs";

// In your admin dashboard
<ActivityLogs />
```

**Data Source**: Uses `useAllActivityLogs` hook to fetch all logs

### 3. Admin Activity Tab (`ActivityTab.tsx`)

**Location**: `client/src/pages/admin/tabs/ActivityTab.tsx`

**Features**:
- Overview statistics (Collections, Alerts, Maintenance, Route Changes)
- Real-time alerts based on waste bin status
- System status overview
- Integrated with the main ActivityLogs component

**Usage**:
```tsx
import { ActivityTab } from "@/pages/admin/tabs/ActivityTab";

// In your admin dashboard tabs
<ActivityTab />
```

## Hooks

### 1. `useActivityLogs` Hook

**Location**: `client/src/hooks/useActivityLogs.ts`

**Purpose**: Fetches activity logs for a specific user

**Usage**:
```tsx
const { logs, user, loading, error } = useActivityLogs(userId);
```

**Returns**:
- `logs`: Array of activity log objects
- `user`: User information
- `loading`: Loading state
- `error`: Error message if any

### 2. `useAllActivityLogs` Hook

**Location**: `client/src/hooks/useActivityLogsApi.ts`

**Purpose**: Fetches all activity logs for admin view

**Usage**:
```tsx
const { logs, loading, error, totalCount, refetch } = useAllActivityLogs(
  limit,    // Number of logs to fetch (default: 100)
  offset,   // Pagination offset (default: 0)
  type,     // Filter by activity type (optional)
  user_id   // Filter by user ID (optional)
);
```

**Returns**:
- `logs`: Array of activity log objects
- `loading`: Loading state
- `error`: Error message if any
- `totalCount`: Total number of logs available
- `refetch`: Function to refresh the data

## Activity Types and Colors

The system uses color-coded badges for different activity types:

- **task_assignment**: Blue - Task assignments to staff
- **bin_emptied**: Green - Bin emptying operations
- **maintenance**: Yellow - Maintenance activities
- **error**: Red - Error conditions
- **login**: Purple - User login events
- **unknown**: Gray - Unclassified activities

## Testing the System

### 1. Create Sample Activity Logs

Use the API endpoint to create test data:

```bash
curl -X POST http://localhost:3000/api/activitylogs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-1",
    "bin_id": "bin-001",
    "bin_location": "Main Entrance",
    "bin_status": "critical",
    "bin_level": 85,
    "assigned_janitor_id": "janitor-001",
    "assigned_janitor_name": "John Doe",
    "task_note": "Urgent collection needed",
    "activity_type": "task_assignment"
  }'
```

### 2. Test Different Activity Types

Create various activity types to test the filtering:

```bash
# Bin emptied
curl -X POST http://localhost:3000/api/activitylogs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "janitor-001",
    "bin_id": "bin-001",
    "bin_location": "Main Entrance",
    "bin_status": "empty",
    "bin_level": 0,
    "activity_type": "bin_emptied",
    "task_note": "Bin successfully emptied"
  }'

# Maintenance
curl -X POST http://localhost:3000/api/activitylogs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "maintenance-001",
    "bin_id": "bin-002",
    "bin_location": "Cafeteria",
    "bin_status": "maintenance",
    "bin_level": 50,
    "activity_type": "maintenance",
    "task_note": "Sensor calibration completed"
  }'
```

## Integration Points

### 1. Task Assignment System

The activity logs system integrates with the task assignment system to automatically log when tasks are assigned to staff members.

### 2. Real-time Monitoring

Real-time waste bin status changes are logged as activities, providing a complete audit trail.

### 3. User Authentication

User login/logout events are logged to track system access.

## Customization

### 1. Adding New Activity Types

To add new activity types:

1. Update the `getActivityTypeColor` function in both components
2. Add the new type to the filter dropdown in the admin view
3. Ensure the backend supports the new activity type

### 2. Modifying Display Fields

To show additional fields:

1. Update the data structure in the hooks
2. Modify the display components to show the new fields
3. Update the backend to include the new data

### 3. Adding New Filters

To add new filters:

1. Update the `useAllActivityLogs` hook to accept new filter parameters
2. Modify the admin ActivityLogs component to include new filter controls
3. Update the backend controller to handle the new filters

## Troubleshooting

### Common Issues

1. **No logs displayed**: Check if the user ID is properly set in localStorage
2. **API errors**: Verify the backend server is running and routes are properly configured
3. **Filtering not working**: Ensure the activity types in the filter match the data in the database

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Check database for activity log data
4. Verify user authentication is working properly

## Performance Considerations

1. **Pagination**: The system supports pagination to handle large numbers of logs
2. **Filtering**: Server-side filtering reduces data transfer
3. **Caching**: Consider implementing caching for frequently accessed logs
4. **Real-time updates**: Use WebSocket connections for real-time activity updates if needed

## Security Considerations

1. **User isolation**: Staff users can only see their own activities
2. **Admin access**: Only admin users can see all system activities
3. **Data validation**: All input data is validated on the server side
4. **Audit trail**: Complete logging of all system activities for compliance

This system provides a comprehensive way to track and monitor all activities in the waste management system, giving both staff and administrators valuable insights into system usage and performance.
