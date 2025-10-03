# GPS Backup System

## Overview
The GPS Backup System automatically handles GPS malfunctions by storing the last known coordinates when GPS returns (0,0) or invalid coordinates. This ensures that bins remain visible on the map even when their GPS is offline.

## How It Works

### 1. GPS Monitoring
- System continuously monitors bin GPS coordinates
- Detects GPS malfunctions when coordinates are (0,0), null, undefined, or out of valid range
- Automatically saves last known coordinates before GPS fails

### 2. Backup Storage
- Last known coordinates are stored in Firebase `gpsBackup` collection
- Each bin has a backup record with:
  - `binId`: Unique bin identifier
  - `lastKnownLatitude`: Last valid latitude
  - `lastKnownLongitude`: Last valid longitude
  - `lastUpdateTime`: When coordinates were last updated
  - `status`: 'online' or 'offline'
  - `reason`: 'gps_malfunction' or 'gps_restored'

### 3. Fallback Display
- When GPS returns (0,0), system uses backup coordinates
- Map shows bins with "GPS Offline" indicator
- Weight and level sensors continue to function normally
- Offline time is displayed (e.g., "10 mins ago")

## API Endpoints

### GET `/api/gps-backup`
Get all GPS backup records

### GET `/api/gps-backup/:binId`
Get GPS backup for specific bin

### POST `/api/gps-backup/save`
Save last known coordinates
```json
{
  "binId": "bin-001",
  "coordinates": {
    "latitude": 10.2105,
    "longitude": 123.7583
  },
  "timestamp": "2025-01-02T10:30:00Z"
}
```

### PUT `/api/gps-backup/:binId/status`
Update GPS status
```json
{
  "isOnline": false,
  "currentCoordinates": {
    "latitude": 10.2105,
    "longitude": 123.7583
  }
}
```

### POST `/api/gps-backup/check-multiple`
Check GPS status for multiple bins
```json
{
  "bins": [
    {
      "id": "bin-001",
      "latitude": 0,
      "longitude": 0
    }
  ]
}
```

## Frontend Integration

### Admin Map Features
- **GPS Offline Counter**: Shows number of bins with GPS issues
- **Offline Bins List**: Displays bins using backup coordinates
- **Time Indicators**: Shows how long bins have been offline
- **Visual Indicators**: Orange color coding for offline bins

### Real-time Updates
- System automatically switches to backup coordinates when GPS fails
- Offline status is updated in real-time
- Map continues to show bin locations using last known coordinates

## Testing

Run the test script to verify functionality:
```bash
cd server
node test-gps-backup.js
```

## Database Schema

### gpsBackup Collection
```javascript
{
  "binId": "string",
  "lastKnownLatitude": "number",
  "lastKnownLongitude": "number", 
  "lastUpdateTime": "string (ISO date)",
  "status": "online | offline",
  "reason": "gps_malfunction | gps_restored",
  "currentLatitude": "number (optional)",
  "currentLongitude": "number (optional)"
}
```

## Benefits

1. **Continuous Visibility**: Bins remain visible on map even when GPS fails
2. **Data Integrity**: Weight and level sensors continue working
3. **Historical Tracking**: Maintains location history for troubleshooting
4. **Automatic Recovery**: System automatically uses backup when needed
5. **Real-time Monitoring**: Immediate detection of GPS issues

## Usage Examples

### Initialize GPS Backup for New Bin
```javascript
await GpsBackupService.initializeBinGpsBackup('bin-001', {
  latitude: 10.2105,
  longitude: 123.7583
});
```

### Monitor Bin GPS Coordinates
```javascript
const result = await GpsBackupService.monitorBinGpsCoordinates('bin-001', {
  latitude: 0, // GPS malfunction
  longitude: 0
});
// Returns backup coordinates and offline status
```

### Get GPS Status Summary
```javascript
const summary = await GpsBackupService.getGpsStatusSummary();
// Returns counts of online/offline bins
```

