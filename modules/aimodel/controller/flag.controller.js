const flagService = require('../service/flag.service');

class FlagController {
  async create(req, res) {
    try {
      const auditorId = req.user.userId;

      const flag = await flagService.addFlag({
        ...req.body,
        auditor_id: auditorId
      });

      return res.status(201).json(flag);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getByProcurement(req, res) {
    try {
      const flags = await flagService.getFlags(req.params.id);
      return res.json(flags);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new FlagController();