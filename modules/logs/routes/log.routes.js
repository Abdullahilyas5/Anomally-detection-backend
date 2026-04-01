const express = require('express');
const logController = require('../controllers/log.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// ========== ADMIN ONLY ROUTES ==========

// Get all logs with filters
router.get('/', authenticateToken, authorizeAdmin, logController.getAllLogs);

// Get critical logs
router.get('/critical', authenticateToken, authorizeAdmin, logController.getCriticalLogs);

// Get failed operations
router.get('/failed', authenticateToken, authorizeAdmin, logController.getFailedOperations);

// Get logs by user
router.get('/user/:userId', authenticateToken, authorizeAdmin, logController.getUserLogs);

// Get logs by action
router.get('/action/:action', authenticateToken, authorizeAdmin, logController.getLogsByAction);

// Get audit trail for entity
router.get('/audit/:entityType/:entityId', authenticateToken, authorizeAdmin, logController.getEntityAuditTrail);

// Get logs by date range
router.get('/date-range', authenticateToken, authorizeAdmin, logController.getLogsByDateRange);

// Get activity summary
router.get('/summary/activity', authenticateToken, authorizeAdmin, logController.getActivitySummary);

// Get user activity breakdown
router.get('/summary/user/:userId', authenticateToken, authorizeAdmin, logController.getUserActivityBreakdown);

// Cleanup old logs
router.delete('/cleanup', authenticateToken, authorizeAdmin, logController.cleanupOldLogs);

module.exports = router;
