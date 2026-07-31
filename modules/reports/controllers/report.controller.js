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

  getPublicReports = async (req, res, next) => {
    try {
      const reports = await reportService.getPublicReports();
      res.status(API_STATUS_CODES.OK).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  };

  downloadPublicReport = async (req, res, next) => {
    try {
      const report = await reportService.getReportById(req.params.id);
      if (!report) {
        return res.status(API_STATUS_CODES.NOT_FOUND).json({
          success: false,
          message: 'Report not found',
        });
      }

      if (!report.isPublic) {
        return res.status(API_STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: 'This report is not public',
        });
      }

      res.download(report.filePath, report.fileName);
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
      const role = req.user?.role;

      if (!['auditor', 'admin'].includes(role)) {
        return res.status(API_STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: 'Only auditors and admins are allowed to download PDF reports',
        });
      }

      return res.download(result.filePath, result.fileName);
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
    const raw = { ...req.query, ...req.body };
    const acceptedKeys = [
      'startDate',
      'endDate',
      'days',
      'status',
      'severity',
      'limit',
      'anomalyIds',
      'isPublic',
      'title',
    ];

    return acceptedKeys.reduce((filters, key) => {
      const value = raw[key];
      if (value !== undefined && value !== null && value !== '') {
        filters[key] = value;
      }
      return filters;
    }, {});
  }
}

module.exports = new ReportController();
