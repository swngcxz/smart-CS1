# Mobile App Coordinate Fallback System

## Overview
The mobile app now implements a comprehensive coordinate fallback system that matches the server-side logic, providing reliable GPS coordinate handling with automatic fallbacks and real-time status updates.

## Architecture

### Core Components

#### 1. **useCoordinateFallback Hook**
- **Location**: `ecobin/hooks/useCoordinateFallback.ts`
- **Purpose**: Centralized coordinate management with fallback logic
- **Features**:
  - Automatic coordinate fetching with 30-second refresh
  - Dynamic status detection (live/stale/offline)
  - Multiple fallback layers
  - Type-safe coordinate handling

#### 2. **Enhanced RealTimeDataContext**
- **Location**: `ecobin/contexts/RealTimeDataContext.tsx`
- **Purpose**: Updated to use dynamic status API
- **Features**:
  - Integration with server's dynamic status system
  - Fixed TypeScript type safety issues
  - Improved coordinate fallback logic

#### 3. **Updated DynamicBinMarker**
- **Location**: `ecobin/components/DynamicBinMarker.tsx`
- **Purpose**: Visual representation with dynamic status
- **Features**:
  - Real-time status updates
  - Color-coded markers
  - Dynamic opacity based on GPS status

## Coordinate Fallback Logic

### Fallback Hierarchy

```
1. Dynamic Status API (Primary)
   ├── Live GPS (< 1 minute)
   ├── Stale GPS (1-5 minutes)
   └── Offline GPS (> 5 minutes)

2. Display Coordinates API (Secondary)
   ├── Backup coordinates
   └── Live coordinates

3. Default Coordinates (Final Fallback)
   └── Central Plaza (10.24371, 123.786917)
```

### Status Detection

#### 🟢 Live GPS
- **Condition**: Data < 1 minute old
- **Visual**: Green marker, 100% opacity
- **Status Text**: "Live GPS"
- **Coordinates**: Uses live GPS coordinates

#### 🟠 Stale GPS
- **Condition**: Data 1-5 minutes old
- **Visual**: Orange marker, 70% opacity
- **Status Text**: "Stale GPS"
- **Coordinates**: Uses backup coordinates if available

#### ⚫ Offline GPS
- **Condition**: Data > 5 minutes old
- **Visual**: Grey marker, 70% opacity
- **Status Text**: "Offline GPS"
- **Coordinates**: Uses backup coordinates if available

## Implementation Details

### useCoordinateFallback Hook

```typescript
interface CoordinateData {
  latitude: number;
  longitude: number;
  source: 'live' | 'backup' | 'stale' | 'offline' | 'default';
  status: 'live' | 'stale' | 'offline';
  gpsValid: boolean;
  satellites: number;
  timestamp?: string;
  lastUpdate?: string;
}

const { coordinates, loading, error, refetch, getStatusInfo, isValid, getTimeSinceUpdate } = useCoordinateFallback({
  binId: 'bin1',
  defaultCoordinates: [10.24371, 123.786917],
  refreshInterval: 30000 // 30 seconds
});
```

### API Integration

#### Dynamic Status API
```typescript
const statusResponse = await apiService.getDynamicBinStatus('bin1');
const dynamicStatus = statusResponse?.status;
```

#### Display Coordinates API
```typescript
const displayResponse = await apiService.getBinCoordinatesForDisplay('bin1');
const coordinatesData = displayResponse?.coordinates;
```

### Type Safety

#### Fixed TypeScript Issues
- **Problem**: `getSafeCoordinates().latitude` could return `undefined`
- **Solution**: Added explicit type guards and return type annotations
- **Result**: All coordinate functions now guarantee `number` types

```typescript
const getSafeCoordinates = useCallback((): { 
  latitude: number; 
  longitude: number; 
  isOffline: boolean; 
  timeSinceLastGPS: string; 
  source?: string 
} => {
  // Always returns valid coordinates - never undefined
  // ...
}, [bin1Data, lastKnownGPS, getTimeSinceLastGPS]);
```

## UI Integration

### DynamicBinMarker Component

#### Status-Based Styling
```typescript
const statusInfo = getStatusInfo();

// Marker color based on status
const getMarkerColor = (status: string) => {
  if (coordinates.status === 'live') {
    // Use bin status colors for live GPS
    switch (status) {
      case 'critical': return '#ef4444'; // red
      case 'warning': return '#f59e0b';  // amber
      default: return '#10b981';         // green
    }
  } else {
    // Use GPS status colors for non-live GPS
    return statusInfo.color;
  }
};

// Dynamic opacity
<View style={[
  styles.markerContainer,
  { 
    backgroundColor: getMarkerColor(bin.status),
    opacity: statusInfo.opacity
  }
]}>
```

#### Real-Time Status Display
```typescript
<Text style={styles.infoText}>
  {statusInfo.icon} GPS: {statusInfo.text} ({coordinates.satellites} sats)
</Text>
<Text style={styles.infoText}>
  🕒 Last Update: {getTimeSinceUpdate()}
</Text>
```

## Error Handling

### Graceful Degradation
1. **API Failures**: Falls back to next available source
2. **Network Issues**: Uses cached coordinates
3. **Invalid Data**: Uses default coordinates
4. **Type Errors**: Fixed with proper type guards

### Error Recovery
```typescript
try {
  // Try dynamic status API
  const statusResponse = await apiService.getDynamicBinStatus(binId);
  // ...
} catch (statusError) {
  console.warn('Dynamic status API failed, trying display coordinates...');
  try {
    // Fallback to display coordinates API
    const displayResponse = await apiService.getBinCoordinatesForDisplay(binId);
    // ...
  } catch (displayError) {
    // Final fallback to default coordinates
    setCoordinates(defaultCoords);
  }
}
```

## Performance Optimizations

### Efficient Updates
- **Refresh Interval**: 30 seconds (configurable)
- **Conditional Updates**: Only updates when status changes
- **Memory Management**: Proper cleanup of intervals

### Caching Strategy
- **Coordinate Caching**: Stores last known valid coordinates
- **Status Caching**: Caches GPS status to avoid unnecessary API calls
- **Error Caching**: Prevents repeated failed API calls

## Testing

### Test Scenarios
1. **Live GPS**: Fresh data with valid coordinates
2. **Stale GPS**: Data 1-5 minutes old
3. **Offline GPS**: Data > 5 minutes old
4. **API Failures**: Network errors and timeouts
5. **Invalid Data**: Zero coordinates and null values

### Test Commands
```bash
# Test coordinate fallback system
node test-coordinate-fallback.js

# Test with different scenarios
node test-thresholds.js
```

## Integration with Server

### API Endpoints Used
- `GET /api/gps-backup/dynamic-status/:binId` - Primary status source
- `GET /api/gps-backup/display/:binId` - Fallback coordinate source

### Data Flow
```
ESP32 → Firebase → Server (Dynamic Status) → Mobile App (useCoordinateFallback) → UI Components
```

### Synchronization
- **Real-time Updates**: 30-second refresh interval
- **Status Consistency**: Matches server-side thresholds
- **Coordinate Accuracy**: Uses same fallback logic as server

## Benefits

### 1. **Reliability**
- Multiple fallback layers ensure coordinates are always available
- Graceful handling of network issues and API failures
- Type-safe coordinate handling prevents runtime errors

### 2. **User Experience**
- Real-time status updates with visual indicators
- Color-coded markers for quick status recognition
- Consistent behavior across web and mobile platforms

### 3. **Maintainability**
- Centralized coordinate logic in reusable hook
- Clear separation of concerns
- Comprehensive error handling and logging

### 4. **Performance**
- Efficient API usage with smart caching
- Configurable refresh intervals
- Minimal memory footprint

## Future Enhancements

### Potential Improvements
1. **Offline Support**: Cache coordinates for offline usage
2. **Predictive Status**: Use historical data for status prediction
3. **Smart Refresh**: Adaptive refresh intervals based on GPS stability
4. **Batch Updates**: Update multiple bins simultaneously

### Monitoring
- Track coordinate accuracy over time
- Monitor API response times
- Alert on prolonged offline status
- Analyze fallback usage patterns

## Troubleshooting

### Common Issues
1. **TypeScript Errors**: Ensure proper type guards for coordinate values
2. **API Failures**: Check network connectivity and server status
3. **Stale Data**: Verify refresh intervals and API response times
4. **UI Inconsistencies**: Check status mapping and color definitions

### Debug Tools
- Console logging for coordinate fallback decisions
- Status information in marker popups
- Error messages in coordinate hook
- Network request monitoring
