const db = require('../../../utils/dbconnect');
const AppError = require('../../../utils/AppError.util');
const { API_STATUS_CODES } = require('../../../app/constant/apistatus');
const SystemLog  = require('../models/log.model');

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
                severity: logData.severity || "info",
                status: logData.status || "success",
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

        return new Promise((resolve, reject) => {
            let whereClause = [];
            let params = [];

            if (userId) {
                whereClause.push('user_id = ?');
                params.push(userId);
            }
            if (action) {
                whereClause.push('action = ?');
                params.push(action);
            }
            if (entityType) {
                whereClause.push('entity_type = ?');
                params.push(entityType);
            }
            if (severity) {
                whereClause.push('severity = ?');
                params.push(severity);
            }
            if (status) {
                whereClause.push('status = ?');
                params.push(status);
            }
            if (startDate) {
                whereClause.push('created_at >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereClause.push('created_at <= ?');
                params.push(endDate);
            }

            const where = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

            // Get total count
            const countSql = `SELECT COUNT(*) as total FROM system_logs ${where}`;
            db.query(countSql, params, (error, countResults) => {
                if (error) return reject(error);

                const total = countResults[0].total;

                // Get logs
                const sql = `SELECT * FROM system_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                db.query(sql, [...params, limit, offset], (error, results) => {
                    if (error) return reject(error);

                    // Parse JSON fields
                    const logs = results.map(log => ({
                        ...log,
                        before_state: log.before_state ? JSON.parse(log.before_state) : null,
                        after_state: log.after_state ? JSON.parse(log.after_state) : null
                    }));

                    resolve({
                        logs,
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    });
                });
            });
        });
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
        return new Promise((resolve, reject) => {
            const { page = 1, limit = 20 } = options;
            const offset = (page - 1) * limit;

            const countSql = 'SELECT COUNT(*) as total FROM system_logs WHERE entity_type = ? AND entity_id = ?';
            db.query(countSql, [entityType, entityId], (error, countResults) => {
                if (error) return reject(error);

                const total = countResults[0].total;

                const sql = `SELECT * FROM system_logs WHERE entity_type = ? AND entity_id = ? 
                            ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                db.query(sql, [entityType, entityId, limit, offset], (error, results) => {
                    if (error) return reject(error);

                    const logs = results.map(log => ({
                        ...log,
                        before_state: log.before_state ? JSON.parse(log.before_state) : null,
                        after_state: log.after_state ? JSON.parse(log.after_state) : null
                    }));

                    resolve({
                        logs,
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    });
                });
            });
        });
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
        return new Promise((resolve, reject) => {
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

            db.query(sql, [days], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }

    /**
     * Get user activity
     * @param {number} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserActivity(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT action, COUNT(*) as count
                FROM system_logs
                WHERE user_id = ?
                GROUP BY action
                ORDER BY count DESC
            `;

            db.query(sql, [userId], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }

    /**
     * Delete old logs (cleanup)
     * @param {number} days - Delete logs older than X days
     * @returns {Promise<number>} - Number of deleted rows
     */
    async deleteOldLogs(days = 90) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
            db.query(sql, [days], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows);
            });
        });
    }
}

module.exports = new LogRepository();
