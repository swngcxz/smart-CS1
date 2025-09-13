# GSM Debug Test Application

A simple React.js-based web application to test your USB GSM 800C module connected to COM12.

## Features

- 🔌 **Real-time Status Monitoring** - Check if GSM module is connected and initialized
- 📱 **Send Custom SMS** - Send messages to any phone number
- 🧪 **Test SMS** - Send predefined test messages
- 🔄 **Auto-refresh Status** - Automatically updates connection status
- 📊 **Visual Feedback** - Clear success/error messages

## Prerequisites

- Node.js installed on your system
- USB GSM 800C module connected to COM12
- SIM card inserted in the GSM module

## Installation

1. Navigate to the gsm-test-app directory:
   ```bash
   cd smart-CS1/gsm-test-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:3001
   ```

3. **Test the GSM module:**
   - The status will show if the GSM module is connected
   - Use "Send Test SMS" to send a predefined test message
   - Use "Send SMS" to send a custom message to any number
   - Use "Refresh Status" to manually check the connection

## Configuration

### Phone Number
The default phone number is set to `+639953207865`. You can change this in:
- `server.js` - Line 12: `const PHONE_NUMBER = '+639953207865';`
- Or use the web interface to send to any number

### COM Port
The application is configured to use COM12. To change this, modify `server.js` line 25:
```javascript
port: 'COM12'  // Change to your COM port
```

## Troubleshooting

### GSM Module Not Connecting
1. Check if the GSM module is properly connected to COM12
2. Verify the SIM card is inserted and has credit
3. Check Windows Device Manager to confirm the COM port
4. Try restarting the application

### SMS Not Sending
1. Ensure the phone number is in international format (+639953207865)
2. Check if the SIM card has sufficient credit
3. Verify the GSM module is properly initialized
4. Check the server console for error messages

### Port Already in Use
If you get a "port already in use" error:
1. Close any other applications using COM12
2. Check if another instance of the server is running
3. Restart your computer if necessary

## API Endpoints

- `GET /api/status` - Get GSM module status
- `POST /api/send-sms` - Send custom SMS
- `POST /api/test-sms` - Send test SMS

## Example API Usage

### Send Custom SMS
```bash
curl -X POST http://localhost:3001/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639953207865", "message": "Hello from GSM test!"}'
```

### Send Test SMS
```bash
curl -X POST http://localhost:3001/api/test-sms
```

## Logs

The server will display detailed logs in the console, including:
- GSM module initialization status
- SMS sending attempts and results
- Error messages and troubleshooting info

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify your GSM module is working with other software
3. Ensure the SIM card is active and has credit
4. Try different COM ports if COM12 doesn't work

