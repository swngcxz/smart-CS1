# Dynamic Bin Status Thresholds

## Overview
The dynamic bin status system now uses more responsive thresholds to quickly detect when GPS data becomes stale or offline.

## Threshold Configuration

### Previous Thresholds
- **Stale GPS**: 5 minutes
- **Offline GPS**: 15 minutes

### New Thresholds (Updated)
- **Fresh Data**: < 1 minute
- **Stale Data**: 1-5 minutes  
- **Offline Data**: > 5 minutes

## Status Categories

### 🟢 Live GPS
- **Condition**: Data < 1 minute old
- **Visual**: Green marker, 100% opacity
- **Status Text**: "Live GPS"
- **Coordinates**: Uses live GPS coordinates
- **Behavior**: Full functionality, real-time updates

### 🟠 Stale GPS
- **Condition**: Data 1-5 minutes old
- **Visual**: Orange marker, 70% opacity
- **Status Text**: "Stale GPS"
- **Coordinates**: Uses backup coordinates if available
- **Behavior**: Reduced functionality, indicates data is outdated

### ⚫ Offline GPS
- **Condition**: Data > 5 minutes old
- **Visual**: Grey marker, 70% opacity
- **Status Text**: "Offline GPS"
- **Coordinates**: Uses backup coordinates if available
- **Behavior**: Limited functionality, indicates system is offline

## Implementation Details

### Service Configuration
```javascript
class DynamicBinStatusService {
  constructor() {
    this.STALE_THRESHOLD = 1 * 60 * 1000; // 1 minute
    this.OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  }
}
```

### Status Determination Logic
```javascript
if (isOffline) {
  status = 'offline';
  coordinatesSource = 'offline';
} else if (!isFresh) {
  status = 'stale';
  coordinatesSource = 'gps_stale';
} else if (hasValidCoordinates && gps_valid) {
  status = 'live';
  coordinatesSource = 'gps_live';
}
```

## Benefits of New Thresholds

### 1. **Faster Detection**
- ESP32 offline detection in 1 minute instead of 5 minutes
- Complete offline detection in 5 minutes instead of 15 minutes

### 2. **Better User Experience**
- Users see status changes more quickly
- More accurate representation of system state
- Clearer distinction between stale and offline states

### 3. **Improved Reliability**
- Quicker fallback to backup coordinates
- More responsive to network issues
- Better handling of ESP32 restarts

## API Endpoints

### Get Dynamic Status
```
GET /api/gps-backup/dynamic-status/:binId
```

### Get All Bins Dynamic Status
```
GET /api/gps-backup/dynamic-status
```

### Get Display Coordinates with Status
```
GET /api/gps-backup/display/:binId
```

## Frontend Integration

### Mobile App
- `RealTimeDataContext`: Uses dynamic status API
- `DynamicBinMarker`: Color-coded based on status
- `apiService`: New methods for dynamic status

### Web Client
- All map components updated
- GPS status indicators working
- Time logs showing correct information

## Testing

### Test Scenarios
1. **Fresh Data (30 seconds)**: ✅ Live GPS
2. **Stale Data (2 minutes)**: ⚠️ Stale GPS
3. **Offline Data (10 minutes)**: ❌ Offline GPS
4. **Very Fresh (10 seconds)**: ✅ Live GPS
5. **Just Stale (1.5 minutes)**: ⚠️ Stale GPS
6. **Just Offline (6 minutes)**: ❌ Offline GPS

### Test Commands
```bash
# Test dynamic status system
node test-dynamic-status.js

# Test threshold scenarios
node test-thresholds.js
```

## Migration Notes

### Breaking Changes
- Status detection is now more sensitive
- Some bins may show as "stale" that previously showed as "live"
- Offline detection happens much faster

### Backward Compatibility
- All existing API endpoints remain functional
- Frontend components gracefully handle new status values
- Backup coordinate system unchanged

## Monitoring

### Key Metrics
- **Response Time**: Status changes within 1-5 minutes
- **Accuracy**: Correctly identifies ESP32 offline state
- **Reliability**: Consistent status across web and mobile

### Alerts
- Monitor for bins stuck in "stale" status
- Alert on prolonged "offline" status
- Track status transition frequency

## Future Enhancements

### Potential Improvements
1. **Configurable Thresholds**: Allow per-bin threshold configuration
2. **Predictive Status**: Use historical data to predict offline events
3. **Smart Notifications**: Alert users when bins go offline
4. **Status History**: Track status changes over time

### Performance Considerations
- Threshold calculations are lightweight
- Status updates happen in real-time
- No significant performance impact on system
