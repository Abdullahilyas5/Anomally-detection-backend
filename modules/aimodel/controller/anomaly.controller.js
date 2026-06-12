const anomalyService = require('../service/anomaly.service');

class AnomalyController {

  async create(req, res) {
    try {
      const anomaly = await anomalyService.create({
        ...req.body,
        auditor_id: req.user.userId,
      });

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

      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const data = await anomalyService.getAll();
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