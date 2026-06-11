const fs = require("fs");
const pdfParse = require("pdf-parse");

async function pdfToJson(filePath) {
    const buffer = await fs.promises.readFile(filePath);

    const data = await pdfParse(buffer);

    console.log("TEXT:", data.text);   // 👈 MUST be string
    console.log("PAGES:", data.numpages);

    return {
        text: data.text,
        pages: data.numpages,
        info: data.info
    };
}