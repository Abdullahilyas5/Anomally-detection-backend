const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
  }
);

const db = {
  sequelize,
  Sequelize,
};

// Load models in specific order to handle dependencies
const modelOrder = [
  'users/models/user.model.js',
  'anomalies/models/procurement.model.js',
  'anomalies/models/procurement-flag.model.js',
  'anomalies/models/anomalies.model.js',
  'logs/models/log.model.js',
  'otp/models/otp.model.js'
];

// Define model name mapping for PascalCase
const modelNameMap = {
  'users/models/user.model.js': 'User',
  'anomalies/models/procurement.model.js': 'Procurement',
  'anomalies/models/procurement-flag.model.js': 'ProcurementFlag',
  'anomalies/models/anomalies.model.js': 'Anomaly',
  'logs/models/log.model.js': 'SystemLog',
  'otp/models/otp.model.js': 'OTP'
};

// Load models in specific order
modelOrder.forEach((modelPath) => {
  const fullPath = path.join(__dirname, '../modules', modelPath);
  if (fs.existsSync(fullPath)) {
    const model = require(fullPath);
    if (model && typeof model === 'function') {
      const modelName = modelNameMap[modelPath];
      db[modelName] = model(sequelize, Sequelize.DataTypes);
    }
  }
});

// Set up associations after all models are loaded
Object.keys(db).forEach((key) => {
  if (db[key] && typeof db[key].associate === 'function') {
    db[key].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
