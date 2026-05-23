const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class ReportMailerService {
  async sendReport({ to, subject, message, attachmentPath, attachmentName }) {
    const transporter = await this.createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      attachments: [{
        filename: attachmentName,
        path: attachmentPath,
        contentType: 'application/pdf',
      }],
    });
  }

  async createTransporter() {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || 587, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      });
    }

    const accessToken = await this.getGoogleAccessToken();
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    });
  }

  async getGoogleAccessToken() {
    const required = ['EMAIL_USER', 'CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing email configuration: ${missing.join(', ')}`);
    }

    const client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const accessToken = await client.getAccessToken();
    return accessToken && accessToken.token;
  }
}

module.exports = new ReportMailerService();
