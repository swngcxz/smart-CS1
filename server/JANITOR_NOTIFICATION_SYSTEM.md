# Janitor Assignment Notification System

## Overview
This system automatically notifies janitors when they are assigned to activities or tasks. It supports both push notifications (via FCM) and in-app notifications stored in Firestore.

## Features
- ✅ **Automatic Notifications**: Janitors are notified when assigned to activities or tasks
- ✅ **Push Notifications**: Real-time push notifications via Firebase Cloud Messaging (FCM)
- ✅ **In-App Notifications**: Persistent notifications stored in Firestore
- ✅ **Priority Levels**: Visual priority indicators (🔴 High, 🟡 Medium, 🟢 Low)
- ✅ **Rich Content**: Includes bin location, level, task notes, and priority
- ✅ **Error Handling**: Graceful fallback if notifications fail
- ✅ **Test Endpoint**: Easy testing of notification functionality

## API Endpoints

### 1. Create Activity with Janitor Assignment
**POST** `/api/activitylogs`

```json
{
  "user_id": "admin123",
  "bin_id": "bin1",
  "bin_location": "Central Plaza",
  "bin_status": "pending",
  "bin_level": 85,
  "assigned_janitor_id": "janitor456",
  "assigned_janitor_name": "John Doe",
  "task_note": "Empty the bin and clean the area",
  "activity_type": "maintenance",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Create Task Assignment
**POST** `/api/task-assignments`

```json
{
  "staff_id": "janitor456",
  "bin_id": "bin1",
  "bin_location": "Central Plaza",
  "task_type": "cleaning",
  "priority": "high",
  "notes": "Urgent cleaning required",
  "assigned_by": "admin123",
  "assigned_at": "2024-01-15T10:30:00Z"
}
```

### 3. Test Notification System
**POST** `/api/test-notification`

```json
{
  "janitorId": "janitor456",
  "binId": "bin1",
  "binLocation": "Central Plaza",
  "binLevel": 85,
  "taskNote": "Test notification",
  "activityType": "test_task",
  "priority": "high"
}
```

## Notification Types

### 1. Activity Assignment Notifications
- **Trigger**: When `assigned_janitor_id` is provided in activity log
- **Type**: `activity_assignment`
- **Title**: "📋 New Activity Assigned"
- **Content**: Includes bin location, level, task notes, and priority

### 2. Task Assignment Notifications
- **Trigger**: When creating a new task assignment
- **Type**: `task_assignment`
- **Title**: "🧹 New Task Assigned"
- **Content**: Includes task type, location, priority, and notes

## Notification Content Format

### Push Notification
```
Title: 🧹 New Task Assigned
Body: You have been assigned a new cleaning for bin bin1 at Central Plaza (85% full) (cleaning).
📝 Note: Urgent cleaning required

Priority: 🔴 high
```

### In-App Notification Data
```json
{
  "binId": "bin1",
  "type": "task_assignment",
  "title": "🧹 New Task Assigned",
  "message": "You have been assigned a new cleaning for bin bin1 at Central Plaza (85% full) (cleaning).\n📝 Note: Urgent cleaning required\n\nPriority: 🔴 high",
  "status": "ASSIGNED",
  "binLevel": 85,
  "gps": { "lat": 0, "lng": 0 },
  "timestamp": "2024-01-15T10:30:00Z",
  "activityId": "activity123",
  "priority": "high",
  "janitorId": "janitor456",
  "read": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Priority Levels

| Priority | Emoji | Description |
|----------|-------|-------------|
| `high` | 🔴 | Urgent tasks requiring immediate attention |
| `medium` | 🟡 | Normal priority tasks |
| `low` | 🟢 | Low priority tasks |

## Database Collections

### 1. `notifications` Collection
Stores in-app notifications for janitors:
```json
{
  "binId": "string",
  "janitorId": "string",
  "type": "task_assignment|activity_assignment",
  "title": "string",
  "message": "string",
  "status": "ASSIGNED|IN_PROGRESS|COMPLETED",
  "binLevel": "number",
  "gps": { "lat": "number", "lng": "number" },
  "timestamp": "Date",
  "read": "boolean",
  "createdAt": "Date"
}
```

### 2. `activitylogs` Collection
Stores activity logs with janitor assignments:
```json
{
  "user_id": "string",
  "bin_id": "string",
  "bin_location": "string",
  "bin_status": "string",
  "bin_level": "number",
  "assigned_janitor_id": "string",
  "assigned_janitor_name": "string",
  "task_note": "string",
  "activity_type": "string",
  "status": "pending|in_progress|done",
  "priority": "high|medium|low",
  "timestamp": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

### 3. `task_assignments` Collection
Stores task assignments:
```json
{
  "staff_id": "string",
  "bin_id": "string",
  "bin_location": "string",
  "task_type": "string",
  "priority": "string",
  "notes": "string",
  "assigned_by": "string",
  "assigned_at": "string",
  "status": "assigned|in_progress|completed"
}
```

## Error Handling

The notification system includes comprehensive error handling:

1. **Janitor Not Found**: Logs error but doesn't fail the main operation
2. **FCM Token Missing**: Logs warning but creates in-app notification
3. **FCM Send Failure**: Logs error but continues with in-app notification
4. **Database Errors**: Logs error and throws exception

## Testing

### Test the Notification System
```bash
curl -X POST http://localhost:8000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "janitorId": "your-janitor-id",
    "binId": "bin1",
    "binLocation": "Test Location",
    "binLevel": 75,
    "taskNote": "Test notification",
    "activityType": "test_task",
    "priority": "medium"
  }'
```

### Test Activity Assignment
```bash
curl -X POST http://localhost:8000/api/activitylogs \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "admin123",
    "bin_id": "bin1",
    "bin_location": "Central Plaza",
    "bin_level": 85,
    "assigned_janitor_id": "janitor456",
    "assigned_janitor_name": "John Doe",
    "task_note": "Empty the bin",
    "activity_type": "maintenance"
  }'
```

## Configuration

### Environment Variables
Make sure these are set in your `.env` file:
```
DATABASE_URL="https://smartbin-841a3.firebaseio.com"
FIREBASE_PROJECT_ID="smartbin-841a3"
```

### Firebase Configuration
The system uses the Firebase service account file:
- `smartbin-841a3-firebase-adminsdk-fbsvc-da8726c0ab.json`

## Monitoring

### Console Logs
The system provides detailed logging:
- `[JANITOR NOTIFICATION]` - Notification processing logs
- `[FCM SERVICE]` - Push notification logs
- `[NOTIFICATION MODEL]` - Database operation logs
- `[TEST NOTIFICATION]` - Test endpoint logs

### Success Indicators
- Push notification sent successfully
- In-app notification created
- Janitor assignment logged

## Troubleshooting

### Common Issues

1. **No notifications received**
   - Check if janitor has FCM token
   - Verify janitor ID exists in users collection
   - Check Firebase configuration

2. **FCM errors**
   - Verify Firebase service account permissions
   - Check FCM token validity
   - Ensure Firebase project is properly configured

3. **Database errors**
   - Verify Firestore rules allow writes
   - Check collection names and field names
   - Ensure proper authentication

### Debug Steps

1. Check server logs for error messages
2. Verify janitor exists in users collection
3. Test with the test endpoint first
4. Check Firebase console for FCM delivery status
5. Verify Firestore collections are created properly

## Future Enhancements

- [ ] Email notifications
- [ ] SMS notifications
- [ ] Notification preferences per janitor
- [ ] Bulk assignment notifications
- [ ] Notification history and analytics
- [ ] Real-time notification status updates
