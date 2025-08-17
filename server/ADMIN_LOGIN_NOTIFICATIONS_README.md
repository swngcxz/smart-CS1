# Admin Login Notification System

## Overview
This document describes the updated notification system that ensures login notifications are only sent to and displayed on the Admin Dashboard. The system prevents staff users from seeing admin notifications and provides real-time login tracking for administrators.

## Key Changes Made

### 1. Backend Updates

#### authController.js
- **Modified login function**: Now sends login notifications for ALL users (not just non-admin users)
- **Simplified notification content**: Shows only user's full name and role
- **Admin-only channel**: All login notifications go to the `admin` notification bucket
- **Cleaner implementation**: Uses the notification controller for consistency

#### notificationController.js
- **New function**: `sendAdminLoginNotification()` - Handles admin login notifications
- **New function**: `getAdminNotifications()` - Secure endpoint for admin notifications only
- **Access control**: Verifies JWT token and admin role before allowing access

#### notificationRoutes.js
- **New route**: `/api/notifications/admin/notifications` - Admin-specific notification endpoint
- **Security**: Protected route that only admin users can access

### 2. Frontend Updates

#### useNotifications.ts
- **Smart routing**: Automatically uses admin endpoint when `userId === 'admin'`
- **Fallback**: Regular users still use their personal notification endpoints

#### NotificationPopover.tsx
- **Role-based access**: Only admin users see admin notifications
- **Staff isolation**: Staff users only see their own notifications

#### Admin Notifications Page
- **Login type support**: Added "login" filter option
- **Visual styling**: Purple badges for login notifications
- **Type filtering**: Can filter by login, critical, warning, success, error, info

## Notification Structure

### Login Notification Payload
```javascript
{
  title: "User Login",
  message: "John Doe (staff)",
  timestamp: 1705123456789,
  read: false,
  type: "login",
  userId: "user123",
  userRole: "staff",
  userEmail: "john@example.com",
  userFullName: "John Doe"
}
```

### Database Path
```
notifications/admin/{notificationId}
```

## Security Features

### 1. Access Control
- **JWT verification**: All admin notification requests require valid JWT token
- **Role checking**: Only users with `role: 'admin'` or `acc_type: 'admin'` can access
- **Endpoint isolation**: Admin notifications are served from a separate, protected endpoint

### 2. Data Isolation
- **Admin bucket**: All admin notifications stored in `notifications/admin/`
- **Staff buckets**: Staff notifications stored in `notifications/{staffId}/`
- **No cross-access**: Staff cannot see admin notifications, even with direct API calls

### 3. Real-time Updates
- **5-second polling**: Admin dashboard refreshes notifications every 5 seconds
- **Immediate display**: Login notifications appear in real-time on admin dashboard
- **Persistent storage**: All notifications stored in Firebase Realtime Database

## API Endpoints

### GET /api/notifications/admin/notifications
- **Purpose**: Fetch admin notifications (login alerts, bin alerts, etc.)
- **Access**: Admin users only
- **Response**: All notifications from admin bucket
- **Security**: JWT verification + role validation

### GET /api/notifications/{userId}
- **Purpose**: Fetch user's personal notifications
- **Access**: Authenticated users (their own notifications only)
- **Response**: User's personal notifications
- **Security**: JWT verification

## Frontend Integration

### Admin Dashboard
- **NotificationPopover**: Shows admin notifications in header
- **Notifications Page**: Full notification management with filters
- **Real-time updates**: Automatic refresh every 5 seconds
- **Type filtering**: Can filter by login, critical, warning, etc.

### Staff Dashboard
- **NotificationPopover**: Shows only staff's personal notifications
- **No admin access**: Cannot see or access admin notification bucket
- **Personal isolation**: Each staff member sees only their own notifications

## Usage Examples

### 1. User Login Flow
1. User logs in (any role: admin, staff, janitor)
2. `authController.login()` calls `sendAdminLoginNotification()`
3. Notification stored in `notifications/admin/`
4. Admin dashboard receives real-time notification
5. Notification displays: "John Doe (staff)" logged in

### 2. Admin Dashboard View
1. Admin navigates to notifications
2. Can filter by type: "login", "critical", "warning", etc.
3. Login notifications show with purple badges
4. Real-time updates every 5 seconds
5. Can mark as read, delete, or filter notifications

### 3. Staff Dashboard View
1. Staff user navigates to notifications
2. Only sees their personal notifications
3. Cannot access admin notification bucket
4. No login notifications from other users

## Testing

### Backend Testing
```bash
# Test admin notification endpoint
curl -H "Authorization: Bearer {admin_jwt}" \
     http://localhost:8000/api/notifications/admin/notifications

# Test regular user endpoint
curl -H "Authorization: Bearer {user_jwt}" \
     http://localhost:8000/api/notifications/{userId}
```

### Frontend Testing
1. **Admin user**: Should see all login notifications + other admin alerts
2. **Staff user**: Should see only personal notifications, no admin access
3. **Real-time**: Login notifications should appear immediately on admin dashboard
4. **Filtering**: Admin should be able to filter by "login" type

## Troubleshooting

### Common Issues

#### 1. Admin Notifications Not Loading
- Check JWT token validity
- Verify user has admin role (`role: 'admin'` or `acc_type: 'admin'`)
- Check Firebase connection
- Verify `/api/notifications/admin/notifications` endpoint

#### 2. Login Notifications Not Appearing
- Check `authController.js` login function
- Verify `sendAdminLoginNotification` is being called
- Check Firebase database path: `notifications/admin/`
- Verify admin dashboard is using `useNotifications("admin")`

#### 3. Staff Seeing Admin Notifications
- Check `NotificationPopover.tsx` role logic
- Verify staff users are not using `useNotifications("admin")`
- Check JWT token role information

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check Firebase database structure
4. Verify JWT token payload
5. Test admin endpoint with Postman/curl

## Future Enhancements

### 1. Real-time WebSocket
- Replace polling with WebSocket connections
- Instant notification delivery
- Reduced server load

### 2. Notification Preferences
- Allow admins to configure which notifications to receive
- Email notifications for critical events
- Custom notification sounds

### 3. Advanced Filtering
- Date range filtering
- User role filtering
- Notification priority levels
- Search functionality

### 4. Notification History
- Archive old notifications
- Export notification data
- Analytics and reporting

## Summary

The updated notification system successfully:
- ✅ Sends login notifications for ALL users to admin dashboard
- ✅ Prevents staff users from seeing admin notifications
- ✅ Provides secure, role-based access control
- ✅ Delivers real-time updates to admin dashboard
- ✅ Maintains clean separation between admin and staff notifications
- ✅ Simplifies notification content (name + role only)
- ✅ Uses consistent notification structure across the system

The system now provides administrators with comprehensive visibility into user activity while maintaining strict security boundaries for different user roles.
