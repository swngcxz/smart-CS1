const express = require('express');
const router = express.Router();
const GPSBackupController = require('../controllers/gpsBackupController');

// Get GPS backup service status
router.get('/status', GPSBackupController.getStatus);

// Get backup coordinates for a specific bin
router.get('/backup/:binId', GPSBackupController.getBackupCoordinates);

// Get display coordinates (backup if live GPS is invalid) for a specific bin
router.get('/display/:binId', GPSBackupController.getDisplayCoordinates);

// Get all bins with their coordinate status
router.get('/bins/status', GPSBackupController.getAllBinsStatus);

// Manually trigger backup for a specific bin
router.post('/backup/:binId', GPSBackupController.triggerBackup);

// Force backup of all valid coordinates
router.post('/force-backup', GPSBackupController.forceBackup);

// Get dynamic bin status
router.get('/dynamic-status/:binId', GPSBackupController.getDynamicBinStatus);

// Get all bins with dynamic status
router.get('/dynamic-status', GPSBackupController.getAllBinsDynamicStatus);

module.exports = router;
