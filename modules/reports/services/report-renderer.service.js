const path = require('path');

class ReportRendererService {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates');
  }

  async render(templateName, data) {
    const ejs = this.loadEjs();
    const templatePath = path.join(this.templateDir, `${templateName}.ejs`);

    return ejs.renderFile(templatePath, { ...data, helpers: this.helpers() }, {
      root: this.templateDir,
      async: true,
    });
  }

  loadEjs() {
    try {
      return require('ejs');
    } catch (error) {
      throw new Error('Missing dependency: run "npm install" in the server folder to install ejs before rendering reports.');
    }
  }

  helpers() {
    return {
      formatDate(value) {
        if (!value) return 'N/A';
        return new Intl.DateTimeFormat('en', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(value));
      },
      number(value) {
        return Number(value || 0).toLocaleString();
      },
      percent(value) {
        return `${Math.round(Number(value || 0))}%`;
      },
      title(value) {
        return String(value || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      },
    };
  }
}

module.exports = new ReportRendererService();
