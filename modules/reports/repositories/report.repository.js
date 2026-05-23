const db = require('../../../utils/database');

const { Op, fn, col, literal } = db.Sequelize;

class ReportRepository {
  buildDateWhere(filters = {}) {
    const where = {};
    const startDate = filters.startDate || this.getStartDateFromDays(filters.days);
    const endDate = filters.endDate;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    return where;
  }

  getStartDateFromDays(days) {
    if (!days) return null;
    const parsedDays = Math.max(1, parseInt(days, 10));
    const date = new Date();
    date.setDate(date.getDate() - parsedDays);
    return date;
  }

  async getAnomalies(filters = {}) {
    const where = this.buildDateWhere(filters);
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    return db.Anomaly.findAll({
      where,
      include: [
        { model: db.Procurement, as: 'procurement', required: false },
        { model: db.User, as: 'auditor', attributes: ['id', 'name', 'email', 'role'], required: false },
        { model: db.User, as: 'assignedAdmin', attributes: ['id', 'name', 'email', 'role'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(filters.limit || 100, 10),
    });
  }

  async getAnomalyById(id) {
    return db.Anomaly.findByPk(id, {
      include: [
        { model: db.Procurement, as: 'procurement', required: false },
        { model: db.User, as: 'auditor', attributes: ['id', 'name', 'email', 'role'], required: false },
        { model: db.User, as: 'assignedAdmin', attributes: ['id', 'name', 'email', 'role'], required: false },
      ],
    });
  }

  async getFlags(filters = {}) {
    const where = this.buildDateWhere(filters);
    if (filters.status) where.status = filters.status;

    return db.ProcurementFlag.findAll({
      where,
      include: [
        { model: db.Procurement, as: 'procurement', required: false },
        { model: db.User, as: 'auditor', attributes: ['id', 'name', 'email', 'role'], required: false },
        { model: db.User, as: 'resolver', attributes: ['id', 'name', 'email', 'role'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(filters.limit || 100, 10),
    });
  }

  async getLogs(filters = {}) {
    const where = this.buildDateWhere(filters);
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;

    return db.SystemLog.findAll({
      where,
      include: [{ model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'role'], required: false }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(filters.limit || 200, 10),
    });
  }

  async getTotals(filters = {}) {
    const anomalyWhere = this.buildDateWhere(filters);
    const flagWhere = this.buildDateWhere(filters);
    const logWhere = this.buildDateWhere(filters);

    const [
      totalAnomalies,
      openAnomalies,
      resolvedAnomalies,
      totalFlags,
      pendingFlags,
      failedLogs,
      totalProcurements,
    ] = await Promise.all([
      db.Anomaly.count({ where: anomalyWhere }),
      db.Anomaly.count({ where: { ...anomalyWhere, status: { [Op.in]: ['open', 'investigating'] } } }),
      db.Anomaly.count({ where: { ...anomalyWhere, status: { [Op.in]: ['resolved', 'closed'] } } }),
      db.ProcurementFlag.count({ where: flagWhere }),
      db.ProcurementFlag.count({ where: { ...flagWhere, status: 'pending' } }),
      db.SystemLog.count({ where: { ...logWhere, status: 'failure' } }),
      db.Procurement.count(),
    ]);

    return { totalAnomalies, openAnomalies, resolvedAnomalies, totalFlags, pendingFlags, failedLogs, totalProcurements };
  }

  async getGroupedCounts(model, field, filters = {}) {
    return model.findAll({
      attributes: [field, [fn('COUNT', col(field)), 'count']],
      where: this.buildDateWhere(filters),
      group: [field],
      raw: true,
    });
  }

  async getAnomalyTrends(filters = {}) {
    return db.Anomaly.findAll({
      attributes: [[literal('DATE(created_at)'), 'date'], [fn('COUNT', col('id')), 'count']],
      where: this.buildDateWhere(filters),
      group: [literal('DATE(created_at)')],
      order: [[literal('DATE(created_at)'), 'ASC']],
      raw: true,
    });
  }

  async getTopAffectedSystems(filters = {}) {
    return db.Anomaly.findAll({
      attributes: ['procurement_id', [fn('COUNT', col('Anomaly.id')), 'count']],
      where: this.buildDateWhere(filters),
      include: [{ model: db.Procurement, as: 'procurement', attributes: ['id', 'title', 'file_name'], required: false }],
      group: ['procurement_id', 'procurement.id', 'procurement.title', 'procurement.file_name'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
    });
  }
}

module.exports = new ReportRepository();
