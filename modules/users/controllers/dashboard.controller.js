// controllers/dashboard.controller.js

const dashboardService = require('../services/dasboard.service');

class DashboardController {

    async citizen(req, res) {
        try {
            const data = await dashboardService.getCitizenDashboard(req.user.id);
            return res.json({ success: true, data });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async auditor(req, res) {
        try {
            const data = await dashboardService.getAuditorDashboard();
            return res.json({ success: true, data });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async admin(req, res) {
        try {
            const data = await dashboardService.getAdminDashboard();
            return res.json({ success: true, data });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ================= USER APPROVAL =================

    async approveUser(req, res) {
        try {
            const { userId, role } = req.body;
            const result = await dashboardService.approveUser(userId, role);
            return res.json({ success: true, data: result });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async declineUser(req, res) {
        try {
            const { userId } = req.body;
            const result = await dashboardService.declineUser(userId);
            return res.json({ success: true, data: result });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async blockUser(req, res) {
        try {
            const { userId } = req.body;
            const result = await dashboardService.blockUser(userId);
            return res.json({ success: true, data: result });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new DashboardController();