const anomalyRepo = require('../repository/anomaly');
const flagRepo = require('../repository/flag');

class AnomalyService {

  // CORE DECISION ENGINE
  async evaluateProcurement(procurementId, auditorId) {

    const flags = await flagRepo.findByProcurement(procurementId);

    if (!flags || flags.length === 0) {
      return { message: 'No flags found' };
    }

    // 🧠 SIMPLE RULE ENGINE (you can upgrade later with ML)
    const highSeverity = flags.filter(f => f.flag_type === 'error').length;
    const suspicious = flags.filter(f => f.flag_type === 'suspicious').length;

    let anomaly = null;

    if (highSeverity >= 2 || suspicious >= 3 || flags.length >= 5) {

      anomaly = await anomalyRepo.create({
        procurement_id: procurementId,
        auditor_id: auditorId,
        title: 'Auto Detected Anomaly',
        description: 'System detected suspicious pattern from flags',
        anomaly_type: 'inconsistency',
        severity: highSeverity >= 2 ? 'high' : 'medium',
        evidence: flags.map(f => f.id),
        status: 'open'
      });
    }

    return {
      anomaly_created: !!anomaly,
      anomaly
    };
  }

  async getAll() {
    return anomalyRepo.findAll();
  }
}

module.exports = new AnomalyService();