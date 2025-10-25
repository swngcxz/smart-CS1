# Bin Connection Monitoring System

## Overview
The Bin Connection Monitoring System automatically tracks bin connections and logs connection errors to the bin history when bins go offline or lose connection.

## Features

### 🔍 **Automatic Connection Monitoring**
- Monitors all bins every 2 minutes
- Detects when bins go offline (no updates for 5+ minutes)
- Automatically logs connection errors to bin history
- Respects daily rate limits (3 records per bin per day)

### 📊 **Connection Status Tracking**
- Real-time connection status for all bins
- Last seen timestamps
- Online/offline status indicators
- Connection error history

### 🚨 **Error Detection & Logging**
- **CONNECTION_TIMEOUT**: Bin hasn't sent data for 5+ minutes
- **BIN_OFFLINE**: Bin is completely offline
- **SIGNAL_LOST**: Communication signal lost
- **POWER_FAILURE**: Power issues detected
- **COMMUNICATION_ERROR**: Communication errors

## API Endpoints

### Get All Connection Statuses
```http
GET /api/bin-connections/status
```
Returns connection status for all bins with statistics.

### Get Specific Bin Status
```http
GET /api/bin-connections/status/:binId
```
Returns connection status for a specific bin.

### Manual Connection Check
```http
POST /api/bin-connections/check/:binId
```
Manually trigger connection check for a specific bin.

### Check All Connections
```http
POST /api/bin-connections/check-all
```
Manually trigger connection check for all bins.

### Get Monitoring Statistics
```http
GET /api/bin-connections/stats
```
Returns connection monitoring statistics.

### Start/Stop Monitoring
```http
POST /api/bin-connections/start
POST /api/bin-connections/stop
```
Start or stop the connection monitoring service.

## Configuration

### Timeout Settings
- **Connection Timeout**: 5 minutes (bins considered offline after 5 minutes of no data)
- **Check Interval**: 2 minutes (how often to check connections)
- **Rate Limiting**: 3 records per bin per day (prevents database spam)

### Error Types
- **CONNECTION_TIMEOUT**: No updates for 5+ minutes
- **BIN_OFFLINE**: No data found for bin
- **SIGNAL_LOST**: Communication signal issues
- **POWER_FAILURE**: Power-related issues
- **COMMUNICATION_ERROR**: General communication errors

## Integration with Bin History

### Automatic Error Logging
When a bin goes offline, the system automatically:
1. Detects the connection issue
2. Creates a connection error record
3. Processes through the hybrid data service
4. Respects rate limits and duplicate filtering
5. Logs to bin history with status "CONNECTION_ERROR"

### Error Record Format
```json
{
  "binId": "bin1",
  "weight": 0,
  "distance": 0,
  "binLevel": 0,
  "gps": { "lat": 0, "lng": 0 },
  "gpsValid": false,
  "satellites": 0,
  "errorMessage": "BIN_OFFLINE: No updates for 15 minutes",
  "status": "CONNECTION_ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Usage Examples

### Check if a bin is online
```javascript
const response = await fetch('/api/bin-connections/status/bin1');
const data = await response.json();
console.log('Bin status:', data.data.isOnline);
```

### Get all offline bins
```javascript
const response = await fetch('/api/bin-connections/status');
const data = await response.json();
const offlineBins = Object.entries(data.data.statuses)
  .filter(([binId, status]) => !status.isOnline)
  .map(([binId]) => binId);
console.log('Offline bins:', offlineBins);
```

### Manually check a bin's connection
```javascript
const response = await fetch('/api/bin-connections/check/bin1', {
  method: 'POST'
});
console.log('Check result:', response.data);
```

## Monitoring Dashboard

The connection monitoring system provides real-time insights:
- Total bins monitored
- Online vs offline bins
- Last seen timestamps
- Connection error history
- Monitoring service status

## Benefits

### 🎯 **Proactive Monitoring**
- Early detection of bin issues
- Automatic error logging
- Reduced manual monitoring

### 📈 **Better Data Quality**
- Tracks connection reliability
- Identifies problematic bins
- Historical connection data

### 🔧 **Maintenance Support**
- Identifies bins needing attention
- Tracks connection patterns
- Supports preventive maintenance

## Testing

Run the connection monitoring test:
```bash
node test-connection-monitoring.js
```

This will test:
- Service startup/shutdown
- Connection checking
- Status retrieval
- Error logging
- Statistics tracking

## Integration Notes

The connection monitoring system integrates seamlessly with:
- **Bin History System**: Automatic error logging
- **Rate Limiting**: Respects daily limits
- **Hybrid Data Service**: Uses existing data processing
- **Health Monitoring**: Complements bin health checks
- **Notification System**: Can trigger alerts for offline bins

## Troubleshooting

### Common Issues
1. **Service not starting**: Check Firebase connection
2. **No bins detected**: Verify Firebase monitoring data structure
3. **Rate limiting**: Check daily limits in rateLimitConfig.js
4. **Connection timeouts**: Adjust timeout settings if needed

### Debug Commands
```bash
# Check service status
curl http://localhost:8000/api/bin-connections/stats

# Test specific bin
curl -X POST http://localhost:8000/api/bin-connections/check/bin1

# Get all statuses
curl http://localhost:8000/api/bin-connections/status
```

This system ensures comprehensive monitoring of bin connections while maintaining database efficiency through intelligent rate limiting and duplicate error filtering.
