const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config');
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

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

module.exports = sequelize;
module.exports.testConnection = testConnection;