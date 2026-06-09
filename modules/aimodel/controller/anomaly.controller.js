const anomalyService = require('../service/anomaly.service');

class AnomalyController {

  async evaluate(req, res) {
    try {
      const result = await anomalyService.evaluateProcurement(
        req.params.id,
        req.user.id
      );

      return res.json(result);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const data = await anomalyService.getAll();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AnomalyController();