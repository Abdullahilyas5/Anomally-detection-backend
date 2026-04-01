const logService = require('../services/log.service');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');

class LogController {

    /**
     * Get all system logs (Admin only)
     * GET /api/logs
     */
    async getAllLogs(req, res, next) {
        try {
            const { page = 1, limit = 20, userId, action, entityType, severity, status, startDate, endDate } = req.query;

            const result = await logService.getAllLogs(
                { userId, action, entityType, severity, status, startDate, endDate },
                { page: parseInt(page), limit: parseInt(limit) }
            );

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs by user (Admin only)
     * GET /api/logs/user/:userId
     */
    async getUserLogs(req, res, next) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await logService.getUserLogs(parseInt(userId), {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs by action (Admin only)
     * GET /api/logs/action/:action
     */
    async getLogsByAction(req, res, next) {
        try {
            const { action } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await logService.getLogsByAction(action, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get critical logs (Admin only)
     * GET /api/logs/critical
     */
    async getCriticalLogs(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const result = await logService.getCriticalLogs({
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get failed operations (Admin only)
     * GET /api/logs/failed
     */
    async getFailedOperations(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const result = await logService.getFailedOperations({
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get audit trail for entity (Admin only)
     * GET /api/logs/audit/:entityType/:entityId
     */
    async getEntityAuditTrail(req, res, next) {
        try {
            const { entityType, entityId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await logService.getEntityAuditTrail(entityType, parseInt(entityId), {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs by date range (Admin only)
     * GET /api/logs/date-range
     */
    async getLogsByDateRange(req, res, next) {
        try {
            const { startDate, endDate, page = 1, limit = 20 } = req.query;

            const result = await logService.getLogsByDateRange(startDate, endDate, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get activity summary (Admin only)
     * GET /api/logs/summary/activity
     */
    async getActivitySummary(req, res, next) {
        try {
            const { days = 7 } = req.query;

            const result = await logService.getActivitySummary(parseInt(days));

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: `Activity summary for last ${days} days`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user activity breakdown (Admin only)
     * GET /api/logs/user/:userId/activity
     */
    async getUserActivityBreakdown(req, res, next) {
        try {
            const { userId } = req.params;

            const result = await logService.getUserActivityBreakdown(parseInt(userId));

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cleanup old logs (Admin only)
     * DELETE /api/logs/cleanup
     */
    async cleanupOldLogs(req, res, next) {
        try {
            const { days = 90 } = req.body;

            const result = await logService.cleanupOldLogs(parseInt(days));

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: result.message,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LogController();
