const flagRepo = require('../repository/flag');

class FlagService {
  async addFlag(data) {
    return flagRepo.create(data);
  }

  async getFlags(procurementId) {
    return flagRepo.findByProcurement(procurementId);
  }
}

module.exports = new FlagService();