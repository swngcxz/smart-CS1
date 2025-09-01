# Bin History and Malfunction Monitoring System

This system provides comprehensive monitoring and history tracking for smart bins using Firebase Firestore. It automatically detects errors, malfunctions, and records all monitoring data for analysis and troubleshooting.

## 🏗️ Architecture

The system follows the MVC (Model-View-Controller) pattern:

- **Model**: `binHistoryModel.js` - Handles Firestore operations
- **Controller**: `binHistoryController.js` - Business logic and error detection
- **Router**: `binHistoryRoutes.js` - API endpoints
- **Utility**: `binHistoryProcessor.js` - Integration with existing monitoring

## 📊 Data Structure

### Firestore Collection: `binHistory`

Each document contains:

```javascript
{
  binId: "string",           // Bin identifier
  timestamp: "Date",         // When the record was created
  weight: "float",           // Weight in kg or percentage
  distance: "float",         // Distance in cm or percentage
  binLevel: "float",         // Bin fill level percentage
  gps: {                     // GPS coordinates
    lat: "float",
    lng: "float"
  },
  gpsValid: "boolean",       // GPS signal validity
  satellites: "int",         // Number of GPS satellites
  status: "enum",            // "OK", "ERROR", or "MALFUNCTION"
  errorMessage: "string",    // Error description (optional)
  createdAt: "Date"          // Record creation timestamp
}
```

## 🚨 Error Detection

The system automatically detects and categorizes issues:

### Status: "ERROR"
- Port connection errors (e.g., "Error opening port")
- Modem connection issues (e.g., "Modem not connected")
- Invalid GPS signals (gpsValid = false)
- No GPS satellites (satellites = 0)
- Invalid GPS coordinates (0,0)

### Status: "MALFUNCTION"
- Abnormal weight readings (< 0 or > 1000 kg)
- Invalid bin level readings (< 0% or > 100%)

### Status: "OK"
- All readings within normal ranges
- GPS signal valid
- No error messages

## 🔌 API Endpoints

### 1. Process Real-time Data
```http
POST /api/bin-history/process
Content-Type: application/json

{
  "binId": "bin1",
  "weight": 45.2,
  "distance": 30.5,
  "binLevel": 65,
  "gps": { "lat": 14.5995, "lng": 120.9842 },
  "gpsValid": true,
  "satellites": 8,
  "errorMessage": null
}
```

### 2. Get Bin History
```http
GET /api/bin-history/:binId?limit=100
```

### 3. Get Error Records
```http
GET /api/bin-history/errors?binId=bin1&limit=50
```

### 4. Get Statistics
```http
GET /api/bin-history/:binId/stats?startDate=2025-01-01&endDate=2025-01-31
```

### 5. Cleanup Old Records
```http
DELETE /api/bin-history/cleanup?daysOld=90
```

## 🔄 Integration with Existing System

The system automatically integrates with the existing monitoring setup:

1. **Real-time Monitoring**: Automatically processes data from Firebase Realtime Database
2. **Error Handling**: Records modem and port connection errors
3. **Data Validation**: Validates all incoming monitoring data
4. **History Tracking**: Maintains complete audit trail of all bin operations

## 🧪 Testing

Run the test script to verify functionality:

```bash
cd server
node test-bin-history.js
```

This will test:
- Normal monitoring data processing
- GPS error detection
- Port error handling
- Modem connection issues
- Malfunction detection

## 📈 Example Usage

### Processing Real-time Data
```javascript
const BinHistoryProcessor = require('./utils/binHistoryProcessor');

// Process normal monitoring data
const result = await BinHistoryProcessor.processMonitoringData({
  binId: 'bin1',
  weight: 45.2,
  distance: 30.5,
  binLevel: 65,
  gps: { lat: 14.5995, lng: 120.9842 },
  gpsValid: true,
  satellites: 8,
  errorMessage: null
});

console.log('Status:', result.status); // "OK"
```

### Processing Errors
```javascript
// Process error data
const errorResult = await BinHistoryProcessor.processError('bin1', 
  'Error opening port: [Error: Opening COM12: File not found]',
  {
    weight: 0,
    distance: 0,
    binLevel: 0,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0
  }
);

console.log('Status:', errorResult.status); // "ERROR"
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

## 📊 Monitoring and Alerts

The system provides:

1. **Real-time Error Detection**: Immediate identification of issues
2. **Historical Analysis**: Track patterns and trends over time
3. **Performance Metrics**: Monitor bin efficiency and reliability
4. **Maintenance Alerts**: Identify bins requiring attention

## 🚀 Getting Started

1. **Install Dependencies**: Ensure all required packages are installed
2. **Configure Firebase**: Set up your Firebase project and credentials
3. **Start Server**: Run `npm start` or `npm run dev`
4. **Test Integration**: Use the test script to verify functionality
5. **Monitor Logs**: Check console output for system status

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Connection**: Verify credentials and project configuration
2. **Data Validation**: Check incoming data format and required fields
3. **Error Processing**: Review error detection logic for false positives
4. **Performance**: Monitor Firestore usage and optimize queries

### Logs to Monitor

- `[BIN HISTORY]` - General system operations
- `[BIN HISTORY MODEL]` - Database operations
- `[BIN HISTORY CONTROLLER]` - Business logic processing
- `[REAL-TIME]` - Real-time data processing

## 📝 License

This system is part of the Smart CS1 project and follows the same licensing terms.
