const express = require('express');
const cors = require('cors');
const path = require('path');
const gsmService = require('./server/services/gsmService');
const smsService = require('./server/services/smsNotificationService');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'gsm-test-dashboard.html'));
});

// Initialize services
async function initializeServices() {
    try {
        console.log('🔧 Initializing GSM Test Server...');
        
        // Initialize SMS service (which includes GSM service)
        await smsService.initialize();
        console.log('✅ Services initialized');
        
    } catch (error) {
        console.error('❌ Failed to initialize services:', error);
    }
}

// API Routes
app.get('/api/test/gsm-service/status', (req, res) => {
    try {
        const status = gsmService.getStatus();
        res.json({
            success: true,
            service: 'GSM Service',
            status: status,
            message: status.isConnected ? 'GSM module connected' : 'GSM module not connected - using fallback mode'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/test/gsm-connection', async (req, res) => {
    try {
        const result = await gsmService.testConnection();
        res.json({
            success: true,
            message: 'GSM connection test completed',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/test/sms-direct', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        console.log(`[SMS DIRECT TEST] Sending SMS to ${phoneNumber}`);
        
        const result = await gsmService.sendSMSWithFallback(phoneNumber, message);

        res.json({
            success: true,
            message: 'Direct SMS test completed',
            result: result
        });

    } catch (error) {
        console.error('[SMS DIRECT TEST] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test with janitor lookup
app.post('/api/test/sms-janitor', async (req, res) => {
    try {
        const { janitorId, taskData } = req.body;
        
        if (!janitorId) {
            return res.status(400).json({
                success: false,
                message: 'Janitor ID is required'
            });
        }

        const defaultTaskData = {
            binName: 'Test Bin',
            binLocation: 'Test Location',
            binLevel: 85,
            weight: 50,
            height: 75,
            coordinates: { latitude: 10.2105, longitude: 123.7583 },
            taskNotes: 'Test message from GSM dashboard',
            assignedBy: 'Test Staff'
        };

        const result = await smsService.sendManualTaskSMS(
            taskData || defaultTaskData, 
            janitorId
        );

        res.json({
            success: true,
            message: 'Janitor SMS test completed',
            result: result
        });

    } catch (error) {
        console.error('[SMS JANITOR TEST] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 GSM Test Server running on http://localhost:${PORT}`);
    console.log(`📱 Open the dashboard in your browser: http://localhost:${PORT}`);
    
    // Initialize services
    await initializeServices();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down GSM Test Server...');
    gsmService.close();
    process.exit(0);
});
