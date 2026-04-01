require('dotenv').config(); // Load dotenv FIRST
const app = require('./app');
const sequelize = require('./utils/dbconnect');

const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✅ Database connection authenticated');

    // Sync all models with database (creates tables if they don't exist)
    // In production, use migrations instead
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Database models synchronized');

    const port = process.env.PORT || 9000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();