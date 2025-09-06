# 🚀 Hybrid Data Storage System

A comprehensive solution for managing IoT hardware notifications with intelligent filtering, batching, and storage optimization.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Monitoring](#monitoring)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Hybrid Data Storage System is designed to handle continuous hardware notifications efficiently while reducing database usage and maintaining data integrity. It implements a multi-tier approach with intelligent data classification, buffering, and batch processing.

### Key Benefits

- **Reduced Database Load**: Only critical data is saved immediately
- **Intelligent Filtering**: Invalid data is filtered out before processing
- **Configurable Intervals**: Different storage intervals for different data types
- **Memory Buffering**: Latest data kept in memory for real-time access
- **Comprehensive Monitoring**: System health and performance tracking
- **Flexible Configuration**: Easy to adjust thresholds and intervals

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Hardware      │───▶│  Hybrid Service  │───▶│   Database      │
│   Devices       │    │                  │    │   (Firestore)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Memory Buffer   │
                       │  (Latest Data)   │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Monitoring     │
                       │   & Alerts      │
                       └──────────────────┘
```

### Data Flow

1. **Hardware Data** → Raw sensor data from IoT devices
2. **Validation** → Data quality checks and validation
3. **Classification** → Categorize data by importance (Critical/Warning/Normal)
4. **Processing** → Immediate save or buffer based on classification
5. **Batch Processing** → Periodic saving of buffered data
6. **Monitoring** → Health checks and alerting

## ✨ Features

### Data Classification
- **Critical**: Immediate database storage
- **Warning**: Buffered with shorter intervals
- **Normal**: Buffered with longer intervals
- **Invalid**: Filtered out completely

### Storage Strategies
- **Immediate Storage**: Critical errors and important events
- **Buffered Storage**: Non-critical data with configurable intervals
- **Memory Cache**: Latest valid data for real-time monitoring

### Validation System
- Weight range validation (0-1000 kg)
- Bin level validation (0-100%)
- GPS coordinate validation
- Satellite count validation
- Error message classification

### Monitoring & Alerts
- Real-time system health monitoring
- Performance metrics tracking
- Automated alerting system
- Configurable thresholds

## 🚀 Installation

### Prerequisites
- Node.js 14+
- Firebase/Firestore database
- Express.js server

### Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
# Add to your .env file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

3. **Initialize Services**
```javascript
const hybridDataService = require('./services/hybridDataService');
const hybridMonitoringService = require('./services/hybridMonitoringService');

// Start monitoring
hybridMonitoringService.startMonitoring();
```

## ⚙️ Configuration

### Basic Configuration

```javascript
const { updateConfig } = require('./config/hybridConfig');

// Update storage intervals
updateConfig('intervals.NORMAL_DATA_INTERVAL', 2 * 60 * 60 * 1000); // 2 hours
updateConfig('intervals.WARNING_DATA_INTERVAL', 30 * 60 * 1000);    // 30 minutes
updateConfig('intervals.CRITICAL_DATA_INTERVAL', 5 * 60 * 1000);    // 5 minutes

// Update validation thresholds
updateConfig('validation.MAX_WEIGHT', 1000);
updateConfig('validation.MIN_WEIGHT', 0);
updateConfig('validation.MAX_BIN_LEVEL', 100);
updateConfig('validation.MIN_BIN_LEVEL', 0);
```

### Advanced Configuration

```javascript
// Buffer management
updateConfig('buffer.MAX_BUFFER_SIZE', 1000);
updateConfig('buffer.MAX_MEMORY_USAGE', 100 * 1024 * 1024); // 100MB

// Error classification
updateConfig('errors.CRITICAL_ERRORS', [
  'MALFUNCTION',
  'SENSOR_FAILURE',
  'COMMUNICATION_LOST',
  'POWER_FAILURE'
]);

// Monitoring thresholds
updateConfig('monitoring.ALERT_THRESHOLDS.HIGH_ERROR_RATE', 0.1); // 10%
updateConfig('monitoring.ALERT_THRESHOLDS.HIGH_MEMORY_USAGE', 0.8); // 80%
```

## 📖 Usage

### Basic Data Processing

```javascript
const hybridDataService = require('./services/hybridDataService');

// Process incoming hardware data
const result = await hybridDataService.processIncomingData({
  binId: 'bin1',
  weight: 45.2,
  distance: 25.5,
  binLevel: 75,
  gps: { lat: 10.3157, lng: 123.8854 },
  gpsValid: true,
  satellites: 8,
  errorMessage: null
});

console.log('Processing result:', result);
```

### Critical Error Handling

```javascript
// Critical errors are saved immediately
const criticalData = {
  binId: 'bin1',
  weight: 0,
  distance: 0,
  binLevel: 0,
  gps: { lat: 0, lng: 0 },
  gpsValid: false,
  satellites: 0,
  errorMessage: 'SENSOR_FAILURE: Weight sensor malfunction detected'
};

const result = await hybridDataService.processIncomingData(criticalData);
// Result: { success: true, action: 'saved_immediately', priority: 'critical' }
```

### Getting Latest Data

```javascript
// Get latest data from memory buffer
const latestData = hybridDataService.getLatestData('bin1');
if (latestData) {
  console.log('Latest data:', latestData);
}
```

### Force Processing

```javascript
// Force process all buffered data
const results = await hybridDataService.forceProcessAll();
console.log('Batch processing results:', results);
```

## 🔌 API Reference

### Endpoints

#### Process Bin Data
```http
POST /api/bin-history/process
Content-Type: application/json

{
  "binId": "bin1",
  "weight": 45.2,
  "distance": 25.5,
  "binLevel": 75,
  "gps": { "lat": 10.3157, "lng": 123.8854 },
  "gpsValid": true,
  "satellites": 8,
  "errorMessage": null
}
```

#### Get Hybrid Statistics
```http
GET /api/bin-history/hybrid/stats
```

#### Get Latest Bin Data
```http
GET /api/bin-history/hybrid/latest/:binId
```

#### Force Process All
```http
POST /api/bin-history/hybrid/force-process
```

#### Update Configuration
```http
PUT /api/bin-history/hybrid/config
Content-Type: application/json

{
  "intervals": {
    "NORMAL_DATA_INTERVAL": 3600000
  }
}
```

### Response Formats

#### Processing Response
```json
{
  "success": true,
  "message": "Bin data processed successfully",
  "action": "buffered",
  "data": { "id": "record_id" },
  "stats": {
    "totalReceived": 1000,
    "totalSaved": 800,
    "totalFiltered": 200,
    "bufferStats": {
      "normal": 50,
      "warning": 10,
      "critical": 5
    }
  }
}
```

#### Statistics Response
```json
{
  "success": true,
  "message": "Hybrid system statistics retrieved successfully",
  "data": {
    "totalDataReceived": 1000,
    "totalDataProcessed": 800,
    "totalDataFiltered": 200,
    "totalDataSaved": 750,
    "criticalErrors": 5,
    "warningErrors": 25,
    "validationErrors": 20,
    "bufferUtilization": {
      "normal": 50,
      "warning": 10,
      "critical": 5
    },
    "uptime": 3600000
  }
}
```

## 📊 Monitoring

### Health Checks

The system automatically performs health checks every 5 minutes (configurable):

- **Error Rate Monitoring**: Tracks validation and critical error rates
- **Buffer Utilization**: Monitors memory buffer usage
- **Memory Usage**: Tracks system memory consumption
- **Processing Rate**: Monitors data processing efficiency
- **Data Freshness**: Checks for stale data

### Alerts

Alerts are triggered when thresholds are exceeded:

- **High Error Rate**: >10% error rate
- **High Buffer Utilization**: >90% buffer usage
- **High Memory Usage**: >80% memory usage
- **Low Processing Rate**: <50% processing rate
- **No Data Received**: >10 minutes without data

### Metrics

Key metrics tracked:

- Total data received/processed/saved/filtered
- Error counts by type
- Buffer utilization by priority
- Processing times and performance
- Memory usage and peak values
- System uptime

## 🧪 Examples

### Running Examples

```bash
# Run all examples
node examples/hybridSystemExample.js

# Run specific example
node -e "require('./examples/hybridSystemExample').exampleBasicProcessing()"
```

### Example Scenarios

1. **Basic Processing**: Normal data flow
2. **Critical Error**: Immediate storage
3. **High Bin Level**: Warning classification
4. **Configuration**: Dynamic config updates
5. **Monitoring**: Health checks and alerts
6. **Batch Processing**: Bulk data handling
7. **Error Scenarios**: Validation failures
8. **Performance Testing**: Load testing

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage
```javascript
// Reduce buffer size
updateConfig('buffer.MAX_BUFFER_SIZE', 500);

// Increase processing frequency
updateConfig('intervals.NORMAL_DATA_INTERVAL', 60 * 60 * 1000); // 1 hour
```

#### High Error Rate
```javascript
// Review validation thresholds
updateConfig('validation.MAX_WEIGHT', 1200); // Increase weight limit
updateConfig('validation.MIN_SATELLITES', 2); // Reduce satellite requirement
```

#### Slow Processing
```javascript
// Increase batch size
updateConfig('database.BATCH_SIZE', 200);

// Reduce processing intervals
updateConfig('intervals.CRITICAL_DATA_INTERVAL', 2 * 60 * 1000); // 2 minutes
```

### Debug Mode

```javascript
// Enable debug logging
updateConfig('development.ENABLE_DEBUG_LOGGING', true);

// Enable performance testing
updateConfig('development.PERFORMANCE_TESTING', true);
```

### Monitoring Commands

```javascript
// Get system health
const health = hybridMonitoringService.assessSystemHealth();
console.log('System health:', health);

// Get active alerts
const alerts = hybridMonitoringService.getActiveAlerts();
console.log('Active alerts:', alerts);

// Generate report
const report = hybridMonitoringService.generateReport();
console.log('System report:', report);
```

## 📈 Performance Optimization

### Database Optimization
- Batch processing reduces database calls
- Configurable batch sizes for optimal performance
- Connection pooling for better resource management

### Memory Optimization
- Configurable buffer limits prevent memory overflow
- Automatic cleanup of old data
- Compression for large datasets

### Network Optimization
- Reduced API calls through batching
- Efficient data serialization
- Configurable retry mechanisms

## 🔒 Security Considerations

- Input validation prevents malicious data
- Rate limiting prevents abuse
- Secure configuration management
- Audit logging for compliance

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the examples and documentation

---

**Happy Coding! 🚀**

