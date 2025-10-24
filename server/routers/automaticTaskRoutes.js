const express = require('express');
const router = express.Router();
const { getAutomaticTasksSince } = require('../controllers/automaticTaskController');

// Get automatic tasks since a specific timestamp
router.get('/automatic', getAutomaticTasksSince);

module.exports = router;
