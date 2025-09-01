# Bin Notification System

A comprehensive MVC-based notification system that automatically sends push notifications to janitors when bin events occur, using Firebase Firestore and Cloud Messaging (FCM).

## 🏗️ Architecture

The system follows the MVC (Model-View-Controller) pattern:

- **Model**: `notificationModel.js` - Handles Firestore operations for users, bin assignments, and notifications
- **Controller**: `binNotificationController.js` - Business logic for event detection and notification sending
- **Service**: `fcmService.js` - Firebase Cloud Messaging service for push notifications
- **Router**: `binNotificationRoutes.js` - API endpoints for the notification system

## 📊 Data Collections

### 1. `users` Collection
Stores janitor accounts with FCM tokens:
```javascript
{
  id: "user123",
  name: "John Doe",
  email: "john@example.com",
  role: "janitor",
  fcmToken: "fcm_token_here",
  createdAt: "Date"
}
```

### 2. `binAssignments` Collection
Maps bins to assigned janitors:
```javascript
{
  id: "bin1",
  binId: "bin1",
  janitorId: "user123",
  assignedAt: "Date",
  status: "active"
}
```

### 3. `binHistory` Collection
Records bin monitoring data (from existing system):
```javascript
{
  binId: "bin1",
  timestamp: "Date",
  weight: 45.2,
  distance: 30.5,
  binLevel: 85,
  gps: { lat: 10.2901, lng: 123.8810 },
  status: "OK",
  errorMessage: null
}
```

### 4. `notifications` Collection
Stores sent notifications:
```javascript
{
  id: "notification_id",
  binId: "bin1",
  janitorId: "user123",
  type: "bin_full",
  title: "🚮 Bin bin1 Needs Collection",
  message: "Bin bin1 is 85% full. Please collect the waste at GPS(10.2901, 123.8810).",
  status: "OK",
  binLevel: 85,
  gps: { lat: 10.2901, lng: 123.8810 },
  timestamp: "Date",
  read: false,
  createdAt: "Date"
}
```

## 🚨 Notification Rules

### Automatic Notifications

1. **Bin Level ≥ 80%** → `bin_full`
   - Title: "🚮 Bin [binId] Needs Collection"
   - Message: "Bin [binId] is [level]% full. Please collect the waste at GPS([lat], [lng])."

2. **Status = ERROR** → `bin_error`
   - Title: "⚠️ Bin [binId] Error Detected"
   - Message: "Bin [binId] has an error: [errorMessage]. Please check at GPS([lat], [lng])."

3. **Status = MALFUNCTION** → `bin_malfunction`
   - Title: "🔧 Bin [binId] Malfunction"
   - Message: "Bin [binId] has a malfunction: [errorMessage]. Please inspect at GPS([lat], [lng])."

4. **GPS Signal Invalid** → `gps_error`
   - Title: "📍 Bin [binId] GPS Issue"
   - Message: "Bin [binId] has GPS signal problems. Please check the GPS module at the bin location."

5. **Connection Issues** → `connection_error`
   - Title: "📡 Bin [binId] Connection Issue"
   - Message: "Bin [binId] has connection problems: [errorMessage]. Please check the communication module."

## 🔌 API Endpoints

### 1. Check and Send Notifications
```http
POST /api/bin-notifications/check-and-notify
Content-Type: application/json

{
  "binId": "bin1",
  "binLevel": 85,
  "status": "OK",
  "gps": { "lat": 10.2901, "lng": 123.8810 },
  "timestamp": "2025-01-01T12:00:00Z",
  "weight": 45.2,
  "distance": 30.5,
  "gpsValid": true,
  "satellites": 8,
  "errorMessage": null
}
```

### 2. Send Manual Notification
```http
POST /api/bin-notifications/manual
Content-Type: application/json

{
  "binId": "bin1",
  "message": "Please check bin1 for maintenance"
}
```

### 3. Get Janitor Notifications
```http
GET /api/bin-notifications/janitor/:janitorId?limit=50
```

### 4. Mark Notification as Read
```http
PUT /api/bin-notifications/:notificationId/read
```

### 5. Get Notification Statistics
```http
GET /api/bin-notifications/stats?janitorId=user123
```

### 6. Test Endpoint
```http
GET /api/bin-notifications/test
```

## 🔄 Integration with Existing System

The notification system automatically integrates with your existing monitoring setup:

1. **Real-time Monitoring**: Automatically checks bin data from Firebase Realtime Database
2. **Event Detection**: Monitors bin level, status, GPS, and connection issues
3. **Automatic Notifications**: Sends push notifications when thresholds are met
4. **History Tracking**: Records all notifications in Firestore for audit purposes

## 📱 Firebase Cloud Messaging

### FCM Message Structure
```javascript
{
  token: "fcm_token",
  notification: {
    title: "🚮 Bin bin1 Needs Collection",
    body: "Bin bin1 is 85% full. Please collect the waste at GPS(10.2901, 123.8810)."
  },
  data: {
    binId: "bin1",
    type: "bin_full",
    status: "OK",
    binLevel: "85",
    gps: '{"lat":10.2901,"lng":123.8810}',
    timestamp: "2025-01-01T12:00:00Z"
  },
  android: {
    priority: "high",
    notification: {
      sound: "default",
      priority: "high",
      channelId: "bin-alerts"
    }
  }
}
```

### FCM Features
- **High Priority**: Notifications are marked as high priority for immediate delivery
- **Sound & Vibration**: Default sound and vibration for attention
- **Custom Channel**: Uses "bin-alerts" channel for Android
- **Data Payload**: Includes all relevant bin information for app processing

## 🧪 Testing

### Run Test Script
```bash
cd server
node test-bin-notifications.js
```

This will test:
- Bin level threshold notifications
- Error status notifications
- Malfunction detection
- GPS error handling
- Connection error detection
- Normal operation (no notification)

### Test with Real Data
```bash
# Test the API endpoint
curl -X POST http://localhost:8000/api/bin-notifications/check-and-notify \
  -H "Content-Type: application/json" \
  -d '{
    "binId": "bin1",
    "binLevel": 85,
    "status": "OK",
    "gps": {"lat": 10.2901, "lng": 123.8810},
    "timestamp": "2025-01-01T12:00:00Z"
  }'
```

## 🔧 Configuration

### Environment Variables
Ensure your `.env` file contains Firebase configuration:
```env
TYPE=service_account
PROJECT_ID=your-project-id
PRIVATE_KEY_ID=your-private-key-id
PRIVATE_KEY=your-private-key
CLIENT_EMAIL=your-client-email
CLIENT_ID=your-client-id
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
CLIENT_X509_CERT_URL=your-cert-url
UNIVERSE_DOMAIN=googleapis.com
FIREBASE_STORAGE_BUCKET=your-bucket
DATABASE_URL=your-database-url
```

### Firebase Project Setup
1. **Enable Cloud Messaging**: In Firebase Console, go to Project Settings > Cloud Messaging
2. **Generate Server Key**: Get the server key for FCM authentication
3. **Configure Android App**: Set up Android app with proper package name
4. **Create Notification Channel**: Set up "bin-alerts" channel in your Android app

## 📱 Client Integration

### React Hook
```javascript
import { useBinNotifications } from '@/hooks/useBinNotifications';

const { notifications, stats, markAsRead, sendManualNotification } = 
  useBinNotifications('user123');
```

### Features
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Read/Unread Management**: Mark individual or all notifications as read
- **Manual Notifications**: Send custom notifications to specific bins
- **Statistics**: Get notification counts and metrics

## 🚀 Getting Started

### 1. Setup Firebase
- Configure Firebase Admin SDK
- Enable Cloud Messaging
- Set up Android/iOS apps

### 2. Create Collections
- Set up `users` collection with janitor accounts
- Create `binAssignments` collection mapping bins to janitors
- Ensure `binHistory` collection is working

### 3. Test Integration
- Run the test script
- Test with real monitoring data
- Verify FCM notifications are received

### 4. Monitor Logs
- Check console for notification events
- Monitor FCM delivery status
- Track notification history in Firestore

## 🔍 Troubleshooting

### Common Issues

1. **FCM Token Invalid**
   - Check if user has valid FCM token
   - Verify Firebase project configuration
   - Test token validation

2. **No Notifications Sent**
   - Check bin assignment mapping
   - Verify notification rules are met
   - Check FCM service configuration

3. **Notifications Not Received**
   - Verify FCM token is current
   - Check Android notification permissions
   - Test with FCM test console

### Logs to Monitor

- `[BIN NOTIFICATION]` - General notification operations
- `[FCM SERVICE]` - FCM message delivery
- `[NOTIFICATION MODEL]` - Database operations

## 📈 Example Workflow

### Scenario: Bin1 Reaches 85% Capacity

1. **Monitoring System** detects bin level = 85%
2. **Bin History System** records the data
3. **Notification Controller** checks if notification is needed
4. **Assignment Lookup** finds janitor assigned to bin1
5. **FCM Service** sends push notification to janitor's device
6. **Firestore** stores notification record
7. **Janitor** receives notification: "🚮 Bin bin1 is 85% full. Please collect the waste at GPS(10.2901, 123.8810)."

## 📝 License

This system is part of the Smart CS1 project and follows the same licensing terms.
