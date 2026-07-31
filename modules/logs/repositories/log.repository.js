const db = require('../../../utils/dbconnect');
const { Op, QueryTypes } = require('sequelize');
const AppError = require('../../../utils/AppError.util');
const { API_STATUS_CODES } = require('../../../app/constant/apistatus');
const SystemLog  = require('../models/log.model')(db);

class LogRepository {

    /**
     * Create a system log entry
     * @param {Object} logData - Log data
     * @returns {Promise<Object>}
     */
    async createLog(logData) {
        try {
            const log = await SystemLog.create({
                user_id: logData.user_id || null,
                user_role: logData.user_role || null,
                action: logData.action,
                entity_type: logData.entity_type || null,
                entity_id: logData.entity_id || null,
                ip_address: logData.ip_address || null,
                severity: logData.severity || 'info',
                status: logData.status || 'success',
                message: logData.message || null,
            });

            console.log('Log created:', log.toJSON());

            return log;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all logs with filtering and pagination
     * @param {Object} options - { page, limit, userId, action, entityType, severity, status, startDate, endDate }
     * @returns {Promise<Object>}
     */
    async getLogs(options = {}) {
        const { page = 1, limit = 20, userId, action, entityType, severity, status, startDate, endDate } = options;
        const offset = (page - 1) * limit;

        const where = {};
        if (userId) where.user_id = userId;
        if (action) where.action = action;
        if (entityType) where.entity_type = entityType;
        if (severity) where.severity = severity;
        if (status) where.status = status;
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at[Op.gte] = startDate;
            if (endDate) where.created_at[Op.lte] = endDate;
        }

        const { count, rows } = await SystemLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit, 10),
            offset,
        });

        return {
            logs: rows.map((log) => log.toJSON()),
            total: count,
            page,
            limit,
            pages: Math.ceil(count / limit),
        };
    }

    /**
     * Get logs by user
     * @param {number} userId - User ID
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getLogsByUser(userId, options = {}) {
        return this.getLogs({ userId, ...options });
    }

    /**
     * Get logs by action
     * @param {string} action - Action name
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getLogsByAction(action, options = {}) {
        return this.getLogs({ action, ...options });
    }

    /**
     * Get critical logs
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getCriticalLogs(options = {}) {
        return this.getLogs({ severity: 'critical', ...options });
    }

    /**
     * Get logs for a specific entity
     * @param {string} entityType - Entity type (e.g., 'user', 'procurement')
     * @param {number} entityId - Entity ID
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getEntityLogs(entityType, entityId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const { count, rows } = await SystemLog.findAndCountAll({
            where: {
                entity_type: entityType,
                entity_id: entityId,
            },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit, 10),
            offset,
        });

        return {
            logs: rows.map((log) => log.toJSON()),
            total: count,
            page,
            limit,
            pages: Math.ceil(count / limit),
        };
    }

    /**
     * Get logs by date range
     * @param {string} startDate - Start date (ISO format)
     * @param {string} endDate - End date (ISO format)
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getLogsByDateRange(startDate, endDate, options = {}) {
        return this.getLogs({ startDate, endDate, ...options });
    }

    /**
     * Get failed operations
     * @param {Object} options - { page, limit }
     * @returns {Promise<Object>}
     */
    async getFailedOperations(options = {}) {
        return this.getLogs({ status: 'failure', ...options });
    }

    /**
     * Get admin activity summary
     * @param {number} days - Number of days to look back
     * @returns {Promise<Object>}
     */
    async getActivitySummary(days = 7) {
        const sql = `
            SELECT 
                action,
                COUNT(*) as count,
                severity,
                status
            FROM system_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY action, severity, status
            ORDER BY count DESC
        `;

        return db.query(sql, {
            replacements: [days],
            type: QueryTypes.SELECT,
        });
    }

    /**
     * Get user activity
     * @param {number} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserActivity(userId) {
        const sql = `
            SELECT action, COUNT(*) as count
            FROM system_logs
            WHERE user_id = ?
            GROUP BY action
            ORDER BY count DESC
        `;

        return db.query(sql, {
            replacements: [userId],
            type: QueryTypes.SELECT,
        });
    }

    /**
     * Delete old logs (cleanup)
     * @param {number} days - Delete logs older than X days
     * @returns {Promise<number>} - Number of deleted rows
     */
    async deleteOldLogs(days = 90) {
        return SystemLog.destroy({
            where: {
                created_at: {
                    [Op.lt]: db.literal(`DATE_SUB(NOW(), INTERVAL ${parseInt(days, 10)} DAY)`),
                },
            },
        });
    }
}

module.exports = new LogRepository();
