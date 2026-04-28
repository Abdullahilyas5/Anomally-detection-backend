const logRepository = require('../repositories/log.repository');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');
const { param } = require('../routes/log.routes');

class LogService {

    /**
     * Log an action/operation
     * @param {Object} logData - { userId, userRole, action, entityType, entityId, before_state, after_state, ip, severity, status, error_message }
     * @returns {Promise<Object>}
     */


    async logAction(logData) {
        try {
            const log = await logRepository.createLog({
                user_id: logData.userId,
                user_role: logData.userRole,
                action: logData.action,
                entity_type: logData.entityType,
                entity_id: logData.entityId,
                ip_address: logData.ip,
                severity: logData.severity || 'info',
                status: logData.status || 'success',
                message: logData.message || null,
            });

            if (!log) {
                console.warn('Failed to create log entry:', logData);
            }

            return log;

        } catch (error) {
            console.error('Error logging action:', error);
            // Don't throw - logging should not break the application
            return null;
        }
    }

    /**
     * Log critical operation
     * @param {number} userId - User ID
     * @param {string} action - Action name
     * @param {Object} details - Additional details
     * @returns {Promise<Object>}
     */


    async logCriticalAction(userId, action, details = {}) {
    return this.logAction({
        userId,
        action,
        severity: 'critical',
        ...details
    });
}

    /**
     * Log error/failed operation
     * @param {number} userId - User ID
     * @param {string} action - Action name
     * @param {string} errorMessage - Error message
     * @param {Object} details - Additional details
     * @returns {Promise<Object>}
     */
    async logError(userId, action, errorMessage, details = {}) {
    return this.logAction({
        userId,
        action,
        status: 'failure',
        error_message: errorMessage,
        severity: 'warning',
        ...details
    });
}

    /**
     * Get all logs (admin only)
     * @param {Object} filters - { userId, action, entityType, severity, status, startDate, endDate }
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getAllLogs(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    return logRepository.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        ...filters
    });
}

    /**
     * Get logs for a specific user
     * @param {number} userId - User ID
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getUserLogs(userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    if (!userId) {
        throw new AppError('User ID required', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getLogsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get logs by action
     * @param {string} action - Action name
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getLogsByAction(action, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    if (!action) {
        throw new AppError('Action required', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getLogsByAction(action, {
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get critical logs
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getCriticalLogs(pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    return logRepository.getCriticalLogs({
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get failed operations
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getFailedOperations(pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    return logRepository.getFailedOperations({
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get audit trail for an entity
     * @param {string} entityType - Entity type
     * @param {number} entityId - Entity ID
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getEntityAuditTrail(entityType, entityId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    if (!entityType || !entityId) {
        throw new AppError('Entity type and ID required', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getEntityLogs(entityType, entityId, {
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get logs by date range
     * @param {string} startDate - Start date (ISO format)
     * @param {string} endDate - End date (ISO format)
     * @param {Object} pagination - { page, limit }
     * @returns {Promise<Object>}
     */
    async getLogsByDateRange(startDate, endDate, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;

    if (!startDate || !endDate) {
        throw new AppError('Start date and end date required', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getLogsByDateRange(startDate, endDate, {
        page: parseInt(page),
        limit: parseInt(limit)
    });
}

    /**
     * Get activity summary
     * @param {number} days - Number of days to look back
     * @returns {Promise<Array>}
     */
    async getActivitySummary(days = 7) {
    if (days < 1 || days > 365) {
        throw new AppError('Days must be between 1 and 365', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getActivitySummary(parseInt(days));
}

    /**
     * Get user activity breakdown
     * @param {number} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserActivityBreakdown(userId) {
    if (!userId) {
        throw new AppError('User ID required', API_STATUS_CODES.BAD_REQUEST);
    }

    return logRepository.getUserActivity(userId);
}

    /**
     * Cleanup old logs
     * @param {number} days - Delete logs older than X days
     * @returns {Promise<Object>}
     */
    async cleanupOldLogs(days = 90) {
    if (days < 7 || days > 365) {
        throw new AppError('Days must be between 7 and 365', API_STATUS_CODES.BAD_REQUEST);
    }

    const deletedCount = await logRepository.deleteOldLogs(parseInt(days));

    return {
        message: `Deleted ${deletedCount} logs older than ${days} days`,
        deletedCount
    };
}
}

module.exports = new LogService();
