const anomalyService = require('../service/anomaly.service');
const LogService = require('../../logs/services/log.service');

class AnomalyController {

  async create(req, res) {
    try {
      const anomaly = await anomalyService.create({
        ...req.body,
        auditor_id: req.user.userId,
      });

      // Log anomaly creation by auditor
      try {
        await LogService.logAction({
          userId: req.user.userId,
          userRole: req.user.role || null,
          action: 'ANOMALY_CREATED',
          entityType: 'anomaly',
          entityId: anomaly?.id || null,
          status: 'success',
          severity: 'info',
          ip: req.ip,
          message: 'Auditor created an anomaly'
        });
      } catch (e) {
        console.error('Failed to log anomaly creation:', e);
      }

      return res.status(201).json({
        success: true,
        message: 'Anomaly created successfully',
        data: anomaly,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async evaluate(req, res) {
    try {
      const result = await anomalyService.evaluateProcurement(
        req.params.id,
        req.user.userId
      );

      // Log evaluation action
      try {
        await LogService.logAction({
          userId: req.user.userId,
          userRole: req.user.role || null,
          action: 'ANOMALY_EVALUATED',
          entityType: 'procurement',
          entityId: req.params.id,
          status: 'success',
          severity: 'info',
          ip: req.ip,
          message: 'Auditor evaluated procurement for anomalies'
        });
      } catch (e) {
        console.error('Failed to log anomaly evaluation:', e);
      }

      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const data = await anomalyService.getAll({
        page: req.query.page,
        limit: req.query.limit,
      });

      // Log access to anomalies list by auditor/admin
      try {
        await LogService.logAction({
          userId: req.user?.userId || null,
          userRole: req.user?.role || null,
          action: 'ANOMALIES_LIST_ACCESSED',
          entityType: 'anomaly',
          status: 'success',
          severity: 'info',
          ip: req.ip,
          message: 'Anomalies list accessed'
        });
      } catch (e) {
        console.error('Failed to log anomalies list access:', e);
      }

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }


  async getType(req, res) {
    try {
      const data = await anomalyService.getType();
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AnomalyController();