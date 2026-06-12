const db = require('../../../utils/database');

const Anomaly = db.Anomaly;
const Procurement = db.Procurement;
const User = db.User;

class AnomalyRepository {
  async create(data) {
    return Anomaly.create(data);
  }

  async findAll() {
    return Anomaly.findAll({
      include: [
        { model: Procurement, as: 'procurement' },
        { model: User, as: 'auditor', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }
}

module.exports = new AnomalyRepository();
