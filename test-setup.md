# Waste Level Task Assignment Setup Guide

## Backend Setup

The following endpoints have been added to support task assignment and activity logging:

### Staff Routes (`/api/staff`)
- `GET /api/staff/janitors` - Get all staff members with janitor role
- `POST /api/staff/seed-sample` - Seed sample janitor data for testing

### Activity Routes (`/api`)
- `POST /api/activitylogs` - Save activity log with task assignment details

## Frontend Integration

The `WasteLevelsTab` component has been updated with:

1. **Real-time janitor data**: Fetches janitors from the API instead of using hardcoded data
2. **Activity logging**: Saves task assignments to the database with detailed information
3. **Enhanced modal**: Shows loading states, error handling, and success confirmations
4. **Toast notifications**: Provides user feedback for all actions

## Testing the Setup

1. **Start your backend server**
2. **Seed sample data** (optional):
   ```bash
   curl -X POST http://localhost:3000/api/staff/seed-sample
   ```
3. **Test janitor fetching**:
   ```bash
   curl http://localhost:3000/api/staff/janitors
   ```
4. **Test activity logging**:
   ```bash
   curl -X POST http://localhost:3000/api/activitylogs \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test-user",
       "bin_id": "bin-1",
       "bin_location": "Central Plaza",
       "bin_status": "critical",
       "bin_level": 85,
       "assigned_janitor_id": "janitor-1",
       "assigned_janitor_name": "Janitor Alice",
       "task_note": "Test assignment",
       "activity_type": "task_assignment"
     }'
   ```

## Database Schema

### Activity Logs Collection
```javascript
{
  user_id: string,
  bin_id: string,
  bin_location: string,
  bin_status: string,
  bin_level: number,
  assigned_janitor_id: string,
  assigned_janitor_name: string,
  task_note: string,
  activity_type: string,
  timestamp: string,
  date: string,
  time: string
}
```

### Staff Collection
```javascript
{
  fullName: string,
  email: string,
  role: string,
  location: string,
  status: string,
  lastActivity: string
}
```

## Features

- ✅ Fetch real janitor data from database
- ✅ Filter janitors by location
- ✅ Assign tasks to selected janitors
- ✅ Log all activities to database
- ✅ Show loading states and error handling
- ✅ Success confirmations with toast notifications
- ✅ Detailed activity tracking with timestamps
