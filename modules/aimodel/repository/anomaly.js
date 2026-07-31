const { where } = require('sequelize');
const db = require('../../../utils/database');

const Anomaly = db.Anomaly;
const Procurement = db.Procurement;
const User = db.User;

class AnomalyRepository {
  async create(data) {
    return Anomaly.create(data);
  }

  async findAll(options = {}) {
    const query = {
      include: [
        { model: Procurement, as: 'procurement' },
        { model: User, as: 'auditor', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    };

    if (options.page || options.limit) {
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.min(1000, Math.max(1, Number(options.limit) || 10));
      const { count, rows } = await Anomaly.findAndCountAll({
        ...query,
        limit,
        offset: (page - 1) * limit,
      });
      return { rows, total: count, page, limit, pages: Math.ceil(count / limit) };
    }

    return Anomaly.findAll(query);
  }

  async findType() {
    return Anomaly.rawAttributes.anomaly_type.values;
  }
}

module.exports = new AnomalyRepository();
