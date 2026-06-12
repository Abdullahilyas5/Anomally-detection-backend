const db = require('../../../utils/database');

const ProcurementFlag = db.ProcurementFlag;
const User = db.User;

class FlagRepository {
  async create(data) {
    return ProcurementFlag.create(data);
  }

  async findByProcurement(procurement_id) {
    return ProcurementFlag.findAll({
      where: { procurement_id },
      include: [
        { model: User, as: 'auditor', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }
}

module.exports = new FlagRepository();
