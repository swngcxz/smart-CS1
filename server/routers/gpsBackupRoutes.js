const express = require('express');
const router = express.Router();
const GpsBackupController = require('../controllers/gpsBackupController');

// Get all GPS backup records
router.get('/', GpsBackupController.getAllGpsBackups);

// Get GPS backup for specific bin
router.get('/:binId', GpsBackupController.getBinGpsBackup);

// Save last known coordinates
router.post('/save', GpsBackupController.saveLastKnownCoordinates);

// Update GPS status for a bin
router.put('/:binId/status', GpsBackupController.updateGpsStatus);

// Delete GPS backup for a bin
router.delete('/:binId', GpsBackupController.deleteGpsBackup);

// Check GPS status for multiple bins
router.post('/check-multiple', GpsBackupController.checkMultipleBinsGpsStatus);

module.exports = router;

