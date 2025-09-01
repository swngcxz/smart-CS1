const express = require('express');
const router = express.Router();
const binHistoryController = require('../controllers/binHistoryController');

/**
 * @route POST /api/bin-history/process
 * @desc Process incoming real-time bin data and create history record
 * @access Public (for IoT devices)
 */
router.post('/bin-history/process', binHistoryController.processBinData);

/**
 * @route GET /api/bin-history/:binId
 * @desc Get bin history by bin ID
 * @access Private
 */
router.get('/bin-history/:binId', binHistoryController.getBinHistory);

/**
 * @route GET /api/bin-history/errors
 * @desc Get error records (optionally filtered by bin ID)
 * @access Private
 */
router.get('/bin-history/errors', binHistoryController.getErrorRecords);

/**
 * @route GET /api/bin-history/:binId/stats
 * @desc Get bin history statistics for a specific bin
 * @access Private
 */
router.get('/bin-history/:binId/stats', binHistoryController.getBinHistoryStats);

/**
 * @route DELETE /api/bin-history/cleanup
 * @desc Cleanup old bin history records
 * @access Private (Admin only)
 */
router.delete('/bin-history/cleanup', binHistoryController.cleanupOldRecords);

module.exports = router;
