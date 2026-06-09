const Anomaly = require('../models/anomalies.model');

class AnomalyRepository {

    async create(data) {
        return Anomaly.create(data);
    }

    async findAll() {
        return Anomaly.findAll({ include: ['procurement'] });
    }
}

module.exports = new AnomalyRepository();