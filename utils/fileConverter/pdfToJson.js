const fs = require("fs");
const pdf = require("pdf-parse");

/**
 * Convert PDF → structured JSON
 */
async function pdfToJson(filePath) {
    const dataBuffer = fs.readFileSync(filePath);

    const data = await pdf(dataBuffer);

    return {
        text: data.text,        // full extracted text
        pages: data.numpages,   // total pages
        info: data.info         // metadata
    };
}

module.exports = pdfToJson;