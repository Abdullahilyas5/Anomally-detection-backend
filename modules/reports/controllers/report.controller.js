const reportService = require('../services/report.service');
const { API_STATUS_CODES } = require('../../../app/constant/apistatus');

class ReportController {
  generateSummaryReport = async (req, res, next) => {
    try {
      await this.handleReport(req, res, 'summary');
    } catch (error) {
      next(error);
    }
  };

  generateExecutiveReport = async (req, res, next) => {
    try {
      await this.handleReport(req, res, 'executive');
    } catch (error) {
      next(error);
    }
  };

  generateComplianceReport = async (req, res, next) => {
    try {
      await this.handleReport(req, res, 'compliance');
    } catch (error) {
      next(error);
    }
  };

  generateIncidentReport = async (req, res, next) => {
    try {
      await this.handleReport(req, res, 'incident');
    } catch (error) {
      next(error);
    }
  };

  generateIncidentReportById = async (req, res, next) => {
    try {
      await this.handleReport(req, res, 'incident', { anomalyId: req.params.id });
    } catch (error) {
      next(error);
    }
  };

  sendReport = async (req, res, next) => {
    try {
      const result = await reportService.sendReport({
        type: req.body.type,
        to: req.body.to || req.body.email,
        subject: req.body.subject,
        message: req.body.message,
        filters: this.getFilters(req),
        requestedBy: req.user,
      });

      res.status(API_STATUS_CODES.OK).json({
        success: true,
        message: 'Report generated and sent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  async handleReport(req, res, type, extraFilters = {}) {
    const format = (req.query.format || 'json').toLowerCase();
    const result = await reportService.generateReport({
      type,
      format,
      filters: { ...this.getFilters(req), ...extraFilters },
      requestedBy: req.user,
    });

    if (format === 'pdf') {
      res.download(result.filePath, result.fileName);
      return;
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(API_STATUS_CODES.OK).send(result.html);
      return;
    }

    res.status(API_STATUS_CODES.OK).json({
      success: true,
      message: 'Report generated successfully',
      data: result.data,
    });
  }

  getFilters(req) {
    const query = req.query || {};
    const body = req.body || {};

    return {
      startDate: query.startDate || body.startDate,
      endDate: query.endDate || body.endDate,
      days: query.days || body.days,
      status: query.status || body.status,
      severity: query.severity || body.severity,
      limit: query.limit || body.limit,
    };
  }
}

module.exports = new ReportController();
