# Task Assignment Integration with ActivityController

## Overview
This document describes the integration of the task assignment system with the backend activityController in the Smart CS1 client application. The system allows staff users to assign waste collection tasks to janitorial staff members.

## Features Implemented

### 1. Backend Integration
- **New API Endpoint**: `POST /api/task-assignments`
- **Controller Function**: `saveTaskAssignment` in `activityController.js`
- **Database Collection**: `task_assignments` in Firestore

### 2. Frontend Components
- **Hook**: `useJanitorialStaff` - Fetches staff from backend
- **Hook**: `useTaskAssignment` - Handles task assignment API calls
- **Integration**: Updated `WasteLevelsTab.tsx` with real backend data

### 3. Task Assignment Flow
1. User clicks on a bin level entry
2. Modal opens showing bin information and real-time data
3. User selects janitorial staff from dropdown (fetched from backend)
4. User adds optional task notes
5. System determines priority based on bin status
6. Task assignment is sent to backend via activityController
7. Success confirmation is shown
8. Modal closes automatically

## Technical Implementation

### Backend Changes

#### activityController.js
```javascript
// New function for task assignments
const saveTaskAssignment = async (req, res, next) => {
  // Saves task assignment to Firestore
  // Includes: staff_id, bin_id, location, priority, notes, etc.
};
```

#### activityRoutes.js
```javascript
// New route for task assignments
router.post("/task-assignments", saveTaskAssignment);
```

### Frontend Changes

#### New Hooks Created
- `useJanitorialStaff.ts` - Fetches janitorial staff from `/api/staff`
- `useTaskAssignment.ts` - Handles task assignment API calls

#### WasteLevelsTab.tsx Updates
- Integrated with backend staff data
- Real-time task assignment functionality
- Error handling and loading states
- Toast notifications for success/error feedback

## Data Flow

### 1. Staff Data Fetching
```
Frontend → useJanitorialStaff → /api/staff → staffController → staffModel → Firestore
```

### 2. Task Assignment
```
Frontend → useTaskAssignment → /api/task-assignments → activityController → Firestore
```

### 3. Data Structure

#### Task Assignment Payload
```typescript
interface TaskAssignment {
  staff_id: string;           // Selected staff member ID
  bin_id: string;             // Bin ID being assigned
  bin_location: string;       // Location of the bin
  task_type: string;          // Type of task (e.g., "waste_collection")
  priority: "low" | "medium" | "high" | "critical"; // Auto-determined
  notes?: string;             // Optional task notes
  assigned_by?: string;       // User assigning the task
  assigned_at?: string;       // Timestamp of assignment
}
```

#### Staff Data Structure
```typescript
interface JanitorialStaff {
  id: string;                 // Staff member ID
  fullName: string;           // Full name
  role: string;               // Job role
  email: string;              // Contact email
  location?: string;          // Assigned location (optional)
  status?: string;            // Current status (optional)
}
```

## Priority Determination

The system automatically determines task priority based on bin status:
- **Critical** (≥85% full) → Priority: "critical"
- **Warning** (70-84% full) → Priority: "high"  
- **Normal** (<70% full) → Priority: "medium"

## Error Handling

### Backend Errors
- Database connection issues
- Invalid data validation
- Firestore operation failures

### Frontend Errors
- API request failures
- Network connectivity issues
- Invalid staff selection
- Missing required data

### User Feedback
- Toast notifications for success/error
- Loading states during operations
- Disabled buttons when appropriate
- Clear error messages with dismiss options

## Fallback Mechanism

If the backend is unavailable or returns no data:
- System falls back to static janitorial staff data
- Users can still assign tasks (though data won't be saved)
- Clear indication when using fallback data

## Usage Instructions

### For Staff Users
1. Navigate to Waste Levels tab
2. Click on any bin level card
3. Review bin information and real-time data
4. Select a janitorial staff member from dropdown
5. Add optional task notes
6. Click "Assign Task"
7. Confirm assignment success

### For Administrators
1. Monitor task assignments in Firestore
2. Track assignment patterns and staff workload
3. Review task priorities and completion rates

## API Endpoints

### GET /api/staff
- **Purpose**: Fetch all janitorial staff
- **Response**: Array of staff members
- **Authentication**: Required

### POST /api/task-assignments
- **Purpose**: Create new task assignment
- **Body**: TaskAssignment interface
- **Response**: Success message with task ID
- **Authentication**: Required

## Database Schema

### task_assignments Collection
```javascript
{
  staff_id: "string",        // Reference to staff member
  bin_id: "string",          // Reference to bin
  bin_location: "string",    // Location string
  task_type: "string",       // Task category
  priority: "string",        // Priority level
  notes: "string",           // Optional notes
  assigned_by: "string",     // User ID who assigned
  assigned_at: "timestamp",  // Assignment timestamp
  status: "string"           // Task status (default: "assigned")
}
```

## Testing

### Backend Testing
1. Ensure server is running on port 8000
2. Verify Firestore connection
3. Test `/api/staff` endpoint returns data
4. Test `/api/task-assignments` endpoint accepts data

### Frontend Testing
1. Run client with `npm run dev`
2. Navigate to staff dashboard
3. Open browser console for debug logs
4. Test task assignment flow
5. Verify error handling

## Troubleshooting

### Common Issues
1. **Staff not loading**: Check backend server and `/api/staff` endpoint
2. **Task assignment failing**: Verify `/api/task-assignments` endpoint
3. **No real-time data**: Check ESP32 connection and data flow
4. **Modal not opening**: Verify bin data structure and click handlers

### Debug Information
- Check browser console for debug logs
- Verify API responses in Network tab
- Check backend server logs for errors
- Verify Firestore collection structure

## Future Enhancements

- **Real-time notifications**: Notify assigned staff immediately
- **Task status tracking**: Track task completion status
- **Staff availability**: Check staff availability before assignment
- **Automated assignments**: AI-powered task distribution
- **Mobile notifications**: Push notifications for urgent tasks
- **Task history**: View and manage assignment history
- **Performance metrics**: Track assignment efficiency and completion rates
