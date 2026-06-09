const procurementRepo = require('../repository/procurement.js');

class ProcurementService {
  async createProcurement(data) {
    return procurementRepo.create(data);
  }

  async getProcurement(id) {
    return procurementRepo.findById(id);
  }

  async getallProcurement() {
    return procurementRepo.findAll();
  }
}

module.exports = new ProcurementService();