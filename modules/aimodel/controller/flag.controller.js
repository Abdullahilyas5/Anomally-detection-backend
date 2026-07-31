const flagService = require('../service/flag.service');
const LogService = require('../../logs/services/log.service');

class FlagController {
  async create(req, res) {
    try {
      const auditorId = req.user.userId;

      const flag = await flagService.addFlag({
        ...req.body,
        auditor_id: auditorId
      });

      // Log flag creation for audit trail
      try {
        await LogService.logAction({
          userId: auditorId,
          userRole: req.user.role || null,
          action: 'FLAG_CREATED',
          entityType: 'flag',
          entityId: flag?.id || flag?.flag_id || null,
          status: 'success',
          severity: 'info',
          ip: req.ip,
          message: `Flag created for procurement ${req.body.procurement_id || req.body.procurementId}`
        });
      } catch (logErr) {
        console.error('Failed to log flag creation:', logErr);
      }

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