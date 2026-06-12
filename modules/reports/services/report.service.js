const db = require('../../../utils/database');
const reportRepository = require('../repositories/report.repository');
const reportRenderer = require('./report-renderer.service');
const pdfService = require('./pdf.service');
const mailer = require('./report-mailer.service');
const storage = require('./report-storage.service');
const AppError = require('../../../utils/AppError.util');
const { API_STATUS_CODES } = require('../../../app/constant/apistatus');

const REPORT_TYPES = ['summary', 'incident'];

class ReportService {
  async generateReport({ type, format = 'json', filters = {}, requestedBy = null }) {
    this.assertReportType(type);
    const data = await this.buildReportData(type, filters, requestedBy);

    if (format === 'json') {
      return { data };
    }

    const html = await reportRenderer.render(type, data);
    if (format === 'html') {
      return { html, data };
    }

    if (format !== 'pdf') {
      throw new AppError('Invalid report format. Use json, html, or pdf.', API_STATUS_CODES.BAD_REQUEST);
    }

    const fileName = this.buildFileName(type);
    const filePath = await pdfService.createPdf({ html, fileName });
    const published = await storage.publish(filePath);

    // Save report metadata to db
    const isPublic = filters.isPublic === 'true' || filters.isPublic === true;
    const reportRecord = await db.Report.create({
      title: filters.title || data.meta.title || `${this.title(type)} Report`,
      type,
      fileName,
      filePath,
      isPublic,
      createdBy: requestedBy?.id || null,
      filters,
    });

    return { data, html, fileName, filePath, storage: published, report: reportRecord };
  }

  async sendReport({ type, to, subject, message, filters = {}, requestedBy = null }) {
    if (!to) {
      throw new AppError('Recipient email is required', API_STATUS_CODES.BAD_REQUEST);
    }

    const result = await this.generateReport({ type, format: 'pdf', filters, requestedBy });

    await mailer.sendReport({
      to,
      subject: subject || `${result.data.meta.title} - ${result.data.meta.generatedAtLabel}`,
      message: message || 'Please find the generated report attached.',
      attachmentPath: result.filePath,
      attachmentName: result.fileName,
    });

    return {
      type,
      to,
      fileName: result.fileName,
      storage: result.storage,
    };
  }

  async buildReportData(type, filters, requestedBy) {
    const [
      totals,
      anomalies,
      flags,
      logs,
      severityBreakdown,
      statusBreakdown,
      trends,
      topAffectedSystems,
    ] = await Promise.all([
      reportRepository.getTotals(filters),
      type === 'incident' && filters.anomalyId ? Promise.resolve([]) : reportRepository.getAnomalies(filters),
      reportRepository.getFlags(filters),
      reportRepository.getLogs(filters),
      reportRepository.getGroupedCounts(db.Anomaly, 'severity', filters),
      reportRepository.getGroupedCounts(db.Anomaly, 'status', filters),
      reportRepository.getAnomalyTrends(filters),
      reportRepository.getTopAffectedSystems(filters),
    ]);

    let incident = null;
    if (type === 'incident' && filters.anomalyId) {
      incident = await reportRepository.getAnomalyById(filters.anomalyId);
      if (!incident) {
        throw new AppError('Incident report anomaly not found', API_STATUS_CODES.NOT_FOUND);
      }
    }

    return {
      meta: this.buildMeta(type, filters, requestedBy),
      kpis: this.buildKpis(totals),
      severityBreakdown,
      statusBreakdown,
      trends,
      topAffectedSystems: topAffectedSystems.map((item) => this.toPlain(item)),
      anomalies: (incident ? [incident] : anomalies).map((item) => this.toPlain(item)),
      flags: flags.map((item) => this.toPlain(item)),
      logs: logs.map((item) => this.toPlain(item)),
      recommendations: this.buildRecommendations(totals, severityBreakdown),
    };
  }

  buildMeta(type, filters, requestedBy) {
    const generatedAt = new Date();
    return {
      type,
      title: `${this.title(type)} Report`,
      generatedAt,
      generatedAtLabel: generatedAt.toISOString().slice(0, 10),
      requestedBy,
      filters,
      periodLabel: this.periodLabel(filters),
    };
  }

  buildKpis(totals) {
    const resolutionRate = totals.totalAnomalies ? (totals.resolvedAnomalies / totals.totalAnomalies) * 100 : 100;
    const riskScore = Math.min(100, (totals.openAnomalies * 10) + (totals.pendingFlags * 5) + (totals.failedLogs * 3));

    return {
      ...totals,
      resolutionRate,
      riskScore,
      businessImpact: riskScore >= 70 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low',
    };
  }

  buildRecommendations(totals, severityBreakdown) {
    const critical = Number((severityBreakdown.find((item) => item.severity === 'critical') || {}).count || 0);
    const high = Number((severityBreakdown.find((item) => item.severity === 'high') || {}).count || 0);
    const recommendations = [];

    if (critical || high) recommendations.push('Prioritize critical and high severity anomalies for immediate investigation.');
    if (totals.pendingFlags) recommendations.push('Clear pending procurement flags and record resolution notes for audit readiness.');
    if (totals.failedLogs) recommendations.push('Review failed operations and confirm whether they indicate access or processing issues.');
    if (!recommendations.length) recommendations.push('Maintain current monitoring cadence and continue weekly compliance review.');

    return recommendations;
  }

  periodLabel(filters = {}) {
    if (filters.startDate || filters.endDate) return `${filters.startDate || 'Beginning'} to ${filters.endDate || 'Now'}`;
    if (filters.days) return `Last ${filters.days} days`;
    return 'All available records';
  }

  buildFileName(type) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}-report-${stamp}.pdf`;
  }

  assertReportType(type) {
    if (!REPORT_TYPES.includes(type)) {
      throw new AppError(`Invalid report type. Use one of: ${REPORT_TYPES.join(', ')}`, API_STATUS_CODES.BAD_REQUEST);
    }
  }

  toPlain(model) {
    return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
  }

  title(value) {
    return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async getPublicReports() {
    return db.Report.findAll({
      where: { isPublic: true },
      include: [
        { model: db.User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getReportById(id) {
    return db.Report.findByPk(id);
  }
}

module.exports = new ReportService();
