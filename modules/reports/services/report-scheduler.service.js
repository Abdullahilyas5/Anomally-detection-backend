const reportService = require('./report.service');

class ReportSchedulerService {
  constructor() {
    this.jobs = [];
  }

  start() {
    if (process.env.REPORT_SCHEDULES_ENABLED !== 'true') return;

    const cron = this.loadCron();
    const recipients = (process.env.REPORT_RECIPIENTS || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    if (!recipients.length) {
      console.warn('Report schedules are enabled, but REPORT_RECIPIENTS is empty.');
      return;
    }

    this.jobs.push(
      cron.schedule(process.env.REPORT_DAILY_CRON || '0 8 * * *', () => this.sendScheduledReport('summary', recipients, { days: 1 })),
      cron.schedule(process.env.REPORT_WEEKLY_CRON || '0 8 * * 1', () => this.sendScheduledReport('incident', recipients, { days: 7 })),
      cron.schedule(process.env.REPORT_MONTHLY_CRON || '0 8 1 * *', () => this.sendScheduledReport('summary', recipients, { days: 30 }))
    );
  }

  async sendScheduledReport(type, recipients, filters) {
    await Promise.all(recipients.map((to) => reportService.sendReport({
      type,
      to,
      filters,
      subject: `Scheduled ${type} report`,
      message: `Attached is the scheduled ${type} report.`,
    })));
  }

  loadCron() {
    try {
      return require('node-cron');
    } catch (error) {
      throw new Error('Missing dependency: run "npm install" in the server folder to install node-cron before enabling scheduled reports.');
    }
  }
}

module.exports = new ReportSchedulerService();
