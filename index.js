require('dotenv').config(); // Load dotenv FIRST
const app = require('./app');
const db = require('./utils/database');
const OTPCronJob = require('./utils/otp-cron.job');
const reportScheduler = require('./modules/reports/services/report-scheduler.service');

const startServer = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection authenticated');

    // Sync all models with database (creates tables if they don't exist)
    // In production, use migrations instead
    await db.sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Database models synchronized');

    // Start OTP cleanup cron job (runs every 5 minutes)
    OTPCronJob.start(5 * 60 * 1000);
    reportScheduler.start();

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
