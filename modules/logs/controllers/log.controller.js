const logService = require('../services/log.service');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');

class LogController {

    /**
     * Get all logs with filters (admin only)
     * GET /api/logs
     */
    async getAllLogs(req, res, next) {
        try {
            const {
                userId,
                action,
                entityType,
                severity,
                status,
                startDate,
                endDate,
                page,
                limit
            } = req.query;

            const filters = {};
            if (userId) filters.userId = userId;
            if (action) filters.action = action;
            if (entityType) filters.entityType = entityType;
            if (severity) filters.severity = severity;
            if (status) filters.status = status;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const pagination = { page, limit };

            const result = await logService.getAllLogs(filters, pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get critical logs (admin only)
     * GET /api/logs/critical
     */
    async getCriticalLogs(req, res, next) {
        try {
            const { page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getCriticalLogs(pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get failed operations (admin only)
     * GET /api/logs/failed
     */
    async getFailedOperations(req, res, next) {
        try {
            const { page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getFailedOperations(pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs for a specific user (admin only)
     * GET /api/logs/user/:userId
     */
    async getUserLogs(req, res, next) {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getUserLogs(userId, pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs by action (admin only)
     * GET /api/logs/action/:action
     */
    async getLogsByAction(req, res, next) {
        try {
            const { action } = req.params;
            const { page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getLogsByAction(action, pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get audit trail for an entity (admin only)
     * GET /api/logs/audit/:entityType/:entityId
     */
    async getEntityAuditTrail(req, res, next) {
        try {
            const { entityType, entityId } = req.params;
            const { page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getEntityAuditTrail(entityType, entityId, pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs by date range (admin only)
     * GET /api/logs/date-range
     */
    async getLogsByDateRange(req, res, next) {
        try {
            const { startDate, endDate, page, limit } = req.query;
            const pagination = { page, limit };

            const result = await logService.getLogsByDateRange(startDate, endDate, pagination);

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: RESPONSE_MESSAGES.LOGS_FETCHED,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get activity summary (admin only)
     * GET /api/logs/summary/activity
     */
    async getActivitySummary(req, res, next) {
        try {
            // This method might not exist in service yet, placeholder
            res.status(API_STATUS_CODES.NOT_IMPLEMENTED).json({
                success: false,
                message: 'Not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user activity breakdown (admin only)
     * GET /api/logs/summary/user/:userId
     */
    async getUserActivityBreakdown(req, res, next) {
        try {
            // This method might not exist in service yet, placeholder
            res.status(API_STATUS_CODES.NOT_IMPLEMENTED).json({
                success: false,
                message: 'Not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cleanup old logs (admin only)
     * DELETE /api/logs/cleanup
     */
    async cleanupOldLogs(req, res, next) {
        try {
            // This method might not exist in service yet, placeholder
            res.status(API_STATUS_CODES.NOT_IMPLEMENTED).json({
                success: false,
                message: 'Not implemented yet'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LogController();