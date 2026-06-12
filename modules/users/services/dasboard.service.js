// services/dashboard.service.js

const dashboardRepo = require('../repositories/dashboard.repository');

class DashboardService {

    async getCitizenDashboard(userId) {
        const [total, pending, reviewed] =
            await dashboardRepo.getCitizenDashboard(userId);

        return {
            totalProcurements: total,
            pendingReviews: pending,
            reviewed
        };
    }

    async getAuditorDashboard() {
        const [
            totalProcurements,
            totalAnomalies,
            highlighted,
            pending,
            anomalyTimeline,
            anomalyDistribution
        ] = await dashboardRepo.getAuditorDashboard();

        return {
            totalProcurements,
            totalAnomalies,
            highlighted,
            pending,
            anomalyTimeline,
            anomalyDistribution
        };
    }

    async getAdminDashboard() {
        const [
            totalAnomalies,
            highlighted,
            totalProcurements,
            pendingUsers,
            totalUsers,
            citizens,
            auditors,
            anomalyTimeline,
            anomalyDistribution,
            recentUsers,
            pendingApprovals,
            alertThreshold,
        ] = await dashboardRepo.getAdminDashboard();

        return {
            totalAnomalies,
            highlighted,
            totalProcurements,
            pendingUsers,
            totalUsers,
            citizens,
            auditors,
            anomalyTimeline,
            anomalyDistribution,
            recentUsers,
            pendingApprovals,
            alertThreshold,
        };
    }

    // ================= USER ACTIONS =================
    async approveUser(userId, role) {
        return dashboardRepo.approveUser(userId, role);
    }

    async declineUser(userId) {
        return dashboardRepo.declineUser(userId);
    }

    async blockUser(userId) {
        return dashboardRepo.blockUser(userId);
    }
}

module.exports = new DashboardService();