const fs = require('fs');
const path = require('path');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../../storage/reports');
  }

  async createPdf({ html, fileName }) {
    const puppeteer = this.loadPuppeteer();
    await fs.promises.mkdir(this.outputDir, { recursive: true });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const filePath = path.join(this.outputDir, fileName);

      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
      });

      return filePath;
    } finally {
      await browser.close();
    }
  }

  loadPuppeteer() {
    try {
      return require('puppeteer');
    } catch (error) {
      throw new Error('Missing dependency: run "npm install" in the server folder to install puppeteer before generating PDFs.');
    }
  }
}

module.exports = new PdfService();
