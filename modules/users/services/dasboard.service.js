// services/dashboard.service.js

const dashboardRepo = require('../repositories/dashboard.repository');

class DashboardService {

    async getCitizenDashboard() {
        const [
            totalProcurements,
            pendingReviews,
            reviewed,
            reports
        ] = await dashboardRepo.getCitizenDashboard();

        return {
            totalProcurements,
            pendingReviews,
            reviewed,
            reports
        };
    }

    async getReportDashboard() {
        const [
            totalPublicReports,
            reviewedReports,
            summaryReports,
            incidentReports,
            reports
        ] = await dashboardRepo.getReportDashboard();

        return {
            totalPublicReports,
            reviewedReports,
            summaryReports,
            incidentReports,
            reports
        };
    }

    async getAuditorDashboard() {
    const [
        totalProcurements,
        totalAnomalies,
        highlighted,
        pending,
        anomalyTimeline,
        anomalyDistribution,
        configThreshold
    ] = await dashboardRepo.getAuditorDashboard();

    return {
        totalProcurements,
        totalAnomalies,
        highlighted,
        pending,
        anomalyTimeline,
        anomalyDistribution,
        alertThreshold: configThreshold?.alertThreshold ?? configThreshold
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
        configThreshold,
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
        alertThreshold: configThreshold?.alertThreshold ?? configThreshold,
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