const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        // unique filename to avoid collisions
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter (only CSV + PDF allowed)
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "application/pdf"
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExt = [".csv", ".pdf"];

    if (
        allowedTypes.includes(file.mimetype) ||
        allowedExt.includes(ext)
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only CSV and PDF files are allowed"), false);
    }
};

// Multer instance
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter
});

module.exports = upload;