const express = require('express');
const router = express.Router();
const pickupRequestController = require('../controllers/pickupRequestController');

// Create pickup request
router.post('/', pickupRequestController.createPickupRequest);

// Get all pickup requests
router.get('/', pickupRequestController.getPickupRequests);

// Assign janitor to pickup request
router.put('/:requestId/assign', pickupRequestController.assignJanitor);

// Update pickup request status
router.put('/:requestId/status', pickupRequestController.updateStatus);

module.exports = router;

