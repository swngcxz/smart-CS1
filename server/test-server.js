const express = require('express');
const app = express();

app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test automatic task endpoint
app.post('/api/test/automatic-task', async (req, res) => {
  try {
    const { binLevel = 90, binId = 'bin1', binLocation = 'Central Plaza' } = req.body;
    
    res.json({
      success: true,
      message: `Test task created for ${binId} at ${binLevel}%`,
      taskId: 'test-' + Date.now(),
      taskData: {
        binId,
        binLevel,
        binLocation,
        status: 'pending',
        source: 'test'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to create test task'
    });
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test server accessible at: http://localhost:${PORT}`);
});