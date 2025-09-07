# Rate Limiting System for Firestore Operations

## Overview

This rate limiting system has been implemented to manage daily upload limits to Firestore, preventing you from exceeding your plan's quotas. The system limits both bin history data uploads and notification uploads to 5 times per day by default.

## Features

- **Per-bin rate limiting**: Each bin can upload data up to 5 times per day
- **Per-user rate limiting**: Each user can receive up to 5 notifications per day
- **Global rate limiting**: Overall system limits (50 uploads per day by default)
- **Automatic daily reset**: Counts reset at midnight (configurable)
- **Real-time monitoring**: Track usage statistics and remaining limits
- **Configurable limits**: Adjust limits without code changes
- **Emergency overrides**: Force reset functionality for critical situations

## Configuration

The rate limiting configuration is stored in `config/rateLimitConfig.js`:

```javascript
{
  limits: {
    maxBinHistoryUploads: 5,        // Per-bin daily limit
    maxNotificationUploads: 5,      // Per-user daily limit
    maxGlobalBinHistoryUploads: 50, // Global daily limit
    maxGlobalNotificationUploads: 50 // Global daily limit
  },
  reset: {
    resetHour: 0,                   // Hour to reset (0 = midnight)
    timezone: 'UTC'
  },
  behavior: {
    blockOnExceed: true,            // Block requests when limit exceeded
    logViolations: true,            // Log rate limit violations
    includeRateLimitInfo: true      // Include rate limit info in responses
  }
}
```

## API Endpoints

### Bin History Rate Limiting

- `GET /api/bin-history/rate-limit/stats` - Get rate limit statistics
- `PUT /api/bin-history/rate-limit/config` - Update rate limit configuration

### Notification Rate Limiting

- `GET /api/notifications/rate-limit/stats` - Get notification rate limit statistics

## How It Works

### Bin History Uploads

1. When a bin sends data via `POST /api/bin-history/process`:
   - System checks if the bin has exceeded its daily limit (5 uploads)
   - System checks if global limit has been exceeded (50 uploads)
   - If limits are exceeded, returns HTTP 429 (Too Many Requests)
   - If allowed, processes the data and records the upload

### Notification Uploads

1. When sending notifications via `POST /api/notifications/send`:
   - System checks if the user has exceeded their daily limit (5 notifications)
   - System checks if global limit has been exceeded (50 notifications)
   - If limits are exceeded, returns HTTP 429 (Too Many Requests)
   - If allowed, sends the notification and records the upload

### Automatic Notifications

The system also applies rate limiting to automatic notifications:
- Critical bin level alerts
- Warning bin level alerts
- Admin login notifications

## Response Format

When rate limits are exceeded, the API returns:

```json
{
  "success": false,
  "message": "Daily upload limit exceeded for this bin",
  "rateLimit": {
    "currentCount": 5,
    "maxCount": 5,
    "remaining": 0,
    "globalCount": 25,
    "globalMaxCount": 50,
    "globalRemaining": 25,
    "resetTime": "2025-09-08T00:00:00.000Z"
  }
}
```

## Monitoring

### Get Current Statistics

```bash
curl -X GET http://localhost:3000/api/bin-history/rate-limit/stats
```

Response:
```json
{
  "success": true,
  "message": "Rate limit statistics retrieved successfully",
  "data": {
    "today": "2025-09-07",
    "binHistoryUploads": {
      "total": 12,
      "maxAllowed": 5,
      "remaining": 0,
      "globalTotal": 12,
      "globalMaxAllowed": 50,
      "globalRemaining": 38
    },
    "notificationUploads": {
      "total": 3,
      "maxAllowed": 5,
      "remaining": 2,
      "globalTotal": 3,
      "globalMaxAllowed": 50,
      "globalRemaining": 47
    },
    "resetTime": "2025-09-08T00:00:00.000Z"
  }
}
```

### Update Configuration

```bash
curl -X PUT http://localhost:3000/api/bin-history/rate-limit/config \
  -H "Content-Type: application/json" \
  -d '{
    "maxBinHistoryUploads": 3,
    "maxNotificationUploads": 3
  }'
```

## Implementation Details

### Files Modified

1. **`services/rateLimitService.js`** - Core rate limiting logic
2. **`controllers/binHistoryController.js`** - Added rate limiting to bin data processing
3. **`controllers/notificationController.js`** - Added rate limiting to notification sending
4. **`config/rateLimitConfig.js`** - Configuration file
5. **`routers/binHistoryRoutes.js`** - Added rate limit endpoints
6. **`routers/notificationRoutes.js`** - Added rate limit endpoints

### Key Components

- **RateLimitService**: Singleton service managing all rate limiting logic
- **In-memory storage**: Uses Maps for fast access (resets on server restart)
- **Automatic cleanup**: Removes old entries and resets daily counts
- **Configuration management**: Dynamic configuration updates

## Benefits

1. **Cost Control**: Prevents exceeding Firestore quotas
2. **Performance**: Reduces unnecessary database writes
3. **Monitoring**: Real-time visibility into usage patterns
4. **Flexibility**: Configurable limits and behavior
5. **Reliability**: Graceful handling of rate limit violations

## Troubleshooting

### Rate Limits Too Restrictive

If you find the limits too restrictive, you can:

1. Update the configuration via API:
```bash
curl -X PUT http://localhost:3000/api/bin-history/rate-limit/config \
  -H "Content-Type: application/json" \
  -d '{"maxBinHistoryUploads": 10}'
```

2. Or modify `config/rateLimitConfig.js` directly

### Emergency Override

In critical situations, you can force reset all counts by restarting the server (counts are stored in memory).

### Monitoring Usage

Regularly check the rate limit statistics to understand your usage patterns and adjust limits accordingly.

## Future Enhancements

- Persistent storage for rate limit counts (survive server restarts)
- Per-hour rate limiting in addition to daily limits
- Email alerts when approaching limits
- Dashboard for rate limit management
- Integration with Firestore usage monitoring

## Support

If you encounter any issues with the rate limiting system, check the server logs for rate limit messages and verify your configuration settings.

