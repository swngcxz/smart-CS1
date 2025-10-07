# GPS Backup System

## Overview
The GPS Backup System automatically backs up valid GPS coordinates from ESP32 devices to Firebase Realtime Database. When live GPS coordinates become invalid (0, null, or false), the system uses backup coordinates to maintain bin location visibility across all maps.

## How It Works

### 1. GPS Monitoring
- System continuously listens to live GPS coordinates from Firebase Realtime Database (`monitoring/bin1`)
- Automatically detects valid coordinates (not 0, null, or false)
- Filters out invalid coordinates to prevent backup of trash data

### 2. Backup Storage
- Valid coordinates are backed up to the same Firebase document under:
  - `backup_latitude`: Last valid latitude
  - `backup_longitude`: Last valid longitude  
  - `backup_timestamp`: When coordinates were last backed up
  - `backup_source`: Source identifier ('gps_backup_service')

### 3. Display Logic
- **Live GPS**: Uses live coordinates when valid
- **Backup GPS**: Uses backup coordinates when live GPS is invalid
- **Default**: Uses default coordinates when no valid data is available

## API Endpoints

### GET `/api/gps-backup/status`
Get GPS backup service status
```json
{
  "success": true,
  "status": {
    "isInitialized": true,
    "lastBackupTime": "2025-01-02T10:30:00Z",
    "cachedCoordinatesCount": 1,
    "cachedBins": ["bin1"]
  }
}
```

### GET `/api/gps-backup/backup/:binId`
Get backup coordinates for specific bin
```json
{
  "success": true,
  "binId": "bin1",
  "coordinates": {
    "latitude": 10.2105,
    "longitude": 123.7583,
    "timestamp": "2025-01-02T10:30:00Z",
    "source": "backup"
  }
}
```

### GET `/api/gps-backup/display/:binId`
Get display coordinates (backup if live GPS is invalid)
```json
{
  "success": true,
  "binId": "bin1",
  "coordinates": {
    "latitude": 10.2105,
    "longitude": 123.7583,
    "source": "backup",
    "timestamp": "2025-01-02T10:30:00Z",
    "gps_valid": false
  }
}
```

### GET `/api/gps-backup/bins/status`
Get all bins with their coordinate status
```json
{
  "success": true,
  "bins": [
    {
      "binId": "bin1",
      "liveGPS": {
        "latitude": 0,
        "longitude": 0,
        "valid": false,
        "timestamp": "2025-01-02T10:30:00Z"
      },
      "backupGPS": {
        "latitude": 10.2105,
        "longitude": 123.7583,
        "valid": true,
        "timestamp": "2025-01-02T09:30:00Z"
      },
      "displaySource": "backup"
    }
  ]
}
```

### POST `/api/gps-backup/backup/:binId`
Manually trigger backup for specific bin
```json
{
  "latitude": 10.2105,
  "longitude": 123.7583
}
```

### POST `/api/gps-backup/force-backup`
Force backup of all valid coordinates

## Frontend Integration

### Web Client
```typescript
import { useDisplayCoordinates, useGpsBackupStatus } from '@/hooks/useGpsBackup';

// Get coordinates for display (backup if live GPS is invalid)
const { coordinates } = useDisplayCoordinates('bin1');

// Get backup system status
const { status } = useGpsBackupStatus();
```

### Mobile App (ecobin)
The mobile app automatically uses backup coordinates when live GPS is invalid through the RealTimeDataContext.

## Firebase Database Structure

```
monitoring/
  bin1/
    latitude: 0                    // Live GPS (invalid)
    longitude: 0                   // Live GPS (invalid)
    gps_valid: false               // Live GPS status
    backup_latitude: 10.2105       // Backup coordinates
    backup_longitude: 123.7583     // Backup coordinates
    backup_timestamp: "2025-01-02T10:30:00Z"
    backup_source: "gps_backup_service"
    // ... other bin data
```

## Configuration

### Backup Frequency
- **Immediate**: Valid coordinates are backed up immediately when received
- **Hourly**: All valid coordinates are backed up every hour (3600000 ms)

### Coordinate Validation
Coordinates are considered valid if:
- Not null or undefined
- Not equal to 0
- Not NaN
- Within valid GPS ranges (-90 to 90 for latitude, -180 to 180 for longitude)

## Testing

Run the test script to verify the system:
```bash
node test-gps-backup.js
```

## Service Lifecycle

1. **Initialization**: Loads existing backup coordinates and starts listeners
2. **Monitoring**: Listens to live GPS data changes in Firebase
3. **Backup**: Immediately backs up valid coordinates
4. **Hourly Backup**: Performs scheduled backup of all valid coordinates
5. **Display**: Provides coordinates for display (live or backup)

## Error Handling

- Invalid coordinates are automatically filtered out
- Service continues running even if individual operations fail
- Comprehensive logging for debugging
- Graceful degradation when backup data is unavailable

## Security

- All operations are server-side only
- No direct client access to backup operations
- Firebase security rules should be configured appropriately
- API endpoints include proper error handling and validation
