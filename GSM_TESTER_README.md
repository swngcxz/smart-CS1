# GSM Test Dashboard - Smart Bin System

A comprehensive testing interface for the GSM GPRS 800C module used in the Smart Bin system. This dashboard allows you to test SMS functionality, monitor GSM module status, and troubleshoot connectivity issues.

## 🚀 Quick Start

### Prerequisites
- **Hardware**: GSM GPRS 800C module connected to COM12
- **SIM Card**: Properly inserted with credit and network signal
- **Software**: Node.js installed on your system

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Hardware Setup**
   - Connect GSM GPRS 800C module to COM12 port
   - Insert SIM card with credit
   - Power on the GSM module
   - Ensure good network signal

3. **Start the GSM Test Server**
   ```bash
   # Option 1: Regular mode
   start-gsm-test.bat
   
   # Option 2: Administrator mode (if needed)
   start-gsm-test-admin.bat
   
   # Option 3: Manual start
   npm start
   ```

4. **Open Dashboard**
   - Browser will automatically open to `http://localhost:3001`
   - If not, manually navigate to this URL

## 📱 Dashboard Features

### Status Monitoring
- **Connection Status**: Shows if GSM module is connected to COM12
- **Initialization**: Displays modem initialization status
- **SIM Card**: Shows SIM card readiness and status
- **Signal Strength**: Real-time signal strength monitoring with visual bars

### Testing Capabilities
1. **GSM Connection Test**
   - Tests module connectivity
   - Checks initialization status
   - Verifies SIM card status
   - Provides troubleshooting recommendations

2. **Direct SMS Test**
   - Send test SMS to any phone number
   - Automatic phone number formatting (supports local and international)
   - Real-time SMS sending status
   - Message length validation

3. **Janitor SMS Test**
   - Test SMS with janitor lookup
   - Requires valid janitor ID
   - Simulates real-world task assignment scenarios

### Real-time Logging
- **Live Logs**: Real-time operation logging
- **Color-coded**: Different colors for info, success, error, warning
- **Auto-scroll**: Automatically scrolls to latest entries
- **Timestamped**: All entries include timestamps

## 🔧 Technical Details

### GSM Service Features
- **Enhanced Error Handling**: Comprehensive error detection and reporting
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Phone Number Formatting**: Automatic international formatting
- **Signal Monitoring**: Real-time signal strength checking
- **SIM Status Detection**: Automatic SIM card status verification

### API Endpoints
- `GET /api/test/gsm-service/status` - Get GSM service status
- `GET /api/test/gsm-connection` - Test GSM connection
- `POST /api/test/sms-direct` - Send direct SMS
- `POST /api/test/sms-janitor` - Send janitor SMS

### Configuration
- **Port**: COM12 (configurable in gsmService.js)
- **Baud Rate**: 9600
- **Phone Format**: Automatic +63 (Philippines) formatting
- **SMS Limit**: 160 characters per SMS

## 🧪 Testing Guide

### Basic Testing
1. **Start the server** using one of the start scripts
2. **Open the dashboard** in your browser
3. **Check status indicators** - all should show "Connected", "Ready", "Ready"
4. **Test GSM connection** - click "Test GSM Connection"
5. **Send test SMS** - enter a phone number and message, click "Send Test SMS"

### Advanced Testing
1. **Signal Quality Testing**
   - Monitor signal strength bars
   - Test in different locations
   - Check for signal quality warnings

2. **Error Scenarios**
   - Disconnect GSM module (should show disconnected status)
   - Remove SIM card (should show SIM error)
   - Test with invalid phone numbers

3. **Performance Testing**
   - Send multiple SMS messages
   - Test with long messages (over 160 characters)
   - Monitor retry mechanisms

## 🛠️ Troubleshooting

### Common Issues

#### GSM Module Not Connected
- **Check**: USB/Serial cable connection
- **Verify**: COM12 port is available
- **Solution**: Reconnect cable, restart server

#### SIM Card Issues
- **Check**: SIM card insertion
- **Verify**: SIM card has credit
- **Solution**: Reinsert SIM card, check PIN

#### No Network Signal
- **Check**: GSM module antenna
- **Verify**: Network coverage in area
- **Solution**: Move to better signal location

#### SMS Sending Fails
- **Check**: Phone number format
- **Verify**: SIM card credit
- **Solution**: Use correct international format

### Error Codes
- **Connection Failed**: GSM module not connected to COM12
- **Initialization Failed**: Modem not properly initialized
- **SIM Error**: SIM card not ready or missing
- **SMS Failed**: SMS sending failed (check credit/signal)

## 📊 Status Indicators

### Connection Status
- 🟢 **Connected**: GSM module connected to COM12
- 🔴 **Disconnected**: GSM module not connected

### Initialization Status
- 🟢 **Ready**: Modem fully initialized
- 🟡 **Pending**: Initialization in progress
- 🔴 **Failed**: Initialization failed

### SIM Status
- 🟢 **Ready**: SIM card ready for SMS
- 🔴 **Error**: SIM card issue
- 🟡 **Unknown**: Status not determined

### Signal Strength
- **Excellent**: 15-31 (5 bars)
- **Good**: 10-14 (3-4 bars)
- **Fair**: 5-9 (2-3 bars)
- **Poor**: 0-4 (0-1 bars)

## 🔄 Maintenance

### Regular Checks
- Monitor signal strength
- Check SIM card credit
- Verify connection stability
- Test SMS functionality

### Updates
- Keep dependencies updated
- Monitor GSM module firmware
- Check for service improvements

## 📞 Support

### Logs
- Check dashboard logs for detailed error information
- Monitor real-time status updates
- Use troubleshooting recommendations

### Testing Scripts
- `test-gsm-sms.js` - Command-line testing
- `npm run test-gsm` - Run automated tests

## 🎯 Best Practices

1. **Always test before production use**
2. **Monitor signal strength regularly**
3. **Keep SIM card topped up**
4. **Use proper phone number formatting**
5. **Check logs for error patterns**
6. **Test in different network conditions**

## 📝 Notes

- The GSM module requires good signal strength for reliable SMS sending
- Phone numbers are automatically formatted for international use
- Long messages (>160 chars) will be sent as multiple SMS
- The dashboard provides real-time monitoring and testing capabilities
- All operations are logged for debugging and monitoring purposes

---

**Smart Bin System - GSM Test Dashboard**  
*Version 1.0 - Enhanced with real SMS functionality*
