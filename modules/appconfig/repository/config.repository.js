const db = require('../../../utils/database');

const Config = db.Config;

class ConfigRepository {

  async getSingleton() {
    const [config] = await Config.findOrCreate({
      where: { id: 1 }, // 🔥 strict singleton
      defaults: {
        id: 1,
        alertThreshold: 0.8,
      },
    });

    return config;
  }

  async updateThreshold(alertThreshold) {
    const config = await this.getSingleton();

    config.alertThreshold = alertThreshold;
    await config.save();

    return config;
  }
}

module.exports = new ConfigRepository();