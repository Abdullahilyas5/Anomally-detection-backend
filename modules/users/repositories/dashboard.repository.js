// repositories/dashboard.repository.js

const db = require('../../../utils/database');
const { Op } = require('sequelize')

const Config = db.Config;
const User = db.User;
const Procurement = db.Procurement;
const Anomaly = db.Anomaly;
const Report = db.Report;

class DashboardRepository {

    // (legacy duplicate removed) - consolidated below

    async getReportDashboard() {
        return Promise.all([
            // total public reports
            Report.count(),

            // reviewed reports
            Report.count(),

            // summary reports
            Report.count({
                where: { type: 'summary' }
            }),

            // incident reports
            Report.count({
                where: { type: 'incident' }
            }),

            // full list of public reports
            Report.findAll({
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }
                ],
                order: [['created_at', 'DESC']]
            })
        ]);
    }

    // ================= CITIZEN =================
    async getCitizenDashboard() {
        return Promise.all([
            Procurement.count(),

            Procurement.count({
                include: [{
                    model: Anomaly,
                    as: 'anomalies',
                    required: false
                }],
                where: { '$anomalies.id$': null },
                distinct: true
            }),

            Anomaly.count(),

            Report.findAll({
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }
                ],
                order: [['created_at', 'DESC']]
            })
        ]);
    }

    // ================= AUDITOR =================
    async getAuditorDashboard() {
        return Promise.all([
            Procurement.count(),

            Anomaly.count(),

            Procurement.count({
                include: [{
                    model: Anomaly,
                    as: 'anomalies',
                    required: true
                }],
                distinct: true
            }),

            Procurement.count({
                include: [{
                    model: Anomaly,
                    as: 'anomalies',
                    required: false
                }],
                where: { '$anomalies.id$': null },
                distinct: true
            }),

            Anomaly.findAll({
                attributes: [
                    [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
                    [db.sequelize.fn('COUNT', '*'), 'count']
                ],
                group: ['date'],
                order: [['date', 'ASC']]
            }),

            Anomaly.findAll({
                attributes: [
                    'anomaly_type',
                    [db.sequelize.fn('COUNT', '*'), 'value']
                ],
                group: ['anomaly_type']
            }),

            // Include current alert threshold configuration so auditor views can display it immediately
            Config.findOne({ attributes: ['alertThreshold'] })
        ]);
    }

    // ================= ADMIN =================
    async getAdminDashboard() {
        return Promise.all([
            Anomaly.count(),

            Procurement.count({
                include: [{
                    model: Anomaly,
                    as: 'anomalies',
                    required: true
                }],
                distinct: true
            }),

            Procurement.count(),

            User.count({ where: { status: 'inactive' } }),

            User.count(),

            User.count({ where: { role: 'citizen' } }),

            User.count({ where: { role: 'auditor' } }),

            Anomaly.findAll({
                attributes: [
                    [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
                    [db.sequelize.fn('COUNT', '*'), 'count']
                ],
                group: ['date'],
                order: [['date', 'ASC']]
            }),

            Anomaly.findAll({
                attributes: [
                    'anomaly_type',
                    [db.sequelize.fn('COUNT', '*'), 'value']
                ],
                group: ['anomaly_type'],
                order: [[db.sequelize.literal('value'), 'DESC']]
            }),

            User.findAll({
                order: [['last_login', 'DESC']],
                limit: 10
            }),

            // ✅ FIXED: Pending approvals (ONLY depends on verification)
            User.findAll({
                where: {
                    is_verified: false,
                    status: {
                        [Op.notIn]: ['blocked', 'active']
                    }
                },
                order: [['created_at', 'DESC']],
                limit: 20
            }),

            Config.findOne({
                attributes: ['alertThreshold']
            }),

        ])
    }

    // ================= USER ACTIONS =================
    async approveUser(userId, role) {
        return User.update(
            {
                role,
                status: 'active',
                is_verified: true
            },
            { where: { id: userId } }
        );
    }

    async declineUser(userId) {
        return User.update(
            {
                status: 'inactive',
                is_verified: false
            },
            { where: { id: userId } }
        );
    }

    async blockUser(userId) {
        return User.update(
            {
                status: 'blocked',
                is_verified: false
            },
            { where: { id: userId } }
        );
    }
}

module.exports = new DashboardRepository();