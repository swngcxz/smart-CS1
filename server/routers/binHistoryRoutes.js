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
 * @route GET /api/bin-history
 * @desc Get all bin history data with optional filters
 * @access Private
 */
router.get('/bin-history', binHistoryController.getAllBinHistory);

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

/**
 * @route GET /api/bin-history/hybrid/stats
 * @desc Get hybrid system statistics
 * @access Private (Admin only)
 */
router.get('/bin-history/hybrid/stats', binHistoryController.getHybridStats);

/**
 * @route GET /api/bin-history/hybrid/latest/:binId
 * @desc Get latest bin data from memory buffer
 * @access Private
 */
router.get('/bin-history/hybrid/latest/:binId', binHistoryController.getLatestBinData);

/**
 * @route GET /api/bin-history/hybrid/latest
 * @desc Get all latest data from memory buffer
 * @access Private
 */
router.get('/bin-history/hybrid/latest', binHistoryController.getAllLatestData);

/**
 * @route POST /api/bin-history/hybrid/force-process
 * @desc Force process all buffered data
 * @access Private (Admin only)
 */
router.post('/bin-history/hybrid/force-process', binHistoryController.forceProcessAll);

/**
 * @route PUT /api/bin-history/hybrid/config
 * @desc Update hybrid system configuration
 * @access Private (Admin only)
 */
router.put('/bin-history/hybrid/config', binHistoryController.updateHybridConfig);

module.exports = router;
