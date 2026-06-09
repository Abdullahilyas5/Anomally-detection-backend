const { ProcurementFlag } = require('../models/procurement-flag.model');

class FlagRepository {
  async create(data) {
    return ProcurementFlag.create(data);
  }

  async findByProcurement(procurement_id) {
    return ProcurementFlag.findAll({ where: { procurement_id } });
  }
}

module.exports = new FlagRepository();