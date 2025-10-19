const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Route calculation endpoints
router.post('/calculate', authMiddleware, routeController.calculateRoute);
router.post('/directions', authMiddleware, routeController.getDirections);
router.get('/nearby-bins', authMiddleware, routeController.getNearbyBins);

module.exports = router;
