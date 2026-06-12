const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

// Citizen & Auditor/Admin accessible public reports
router.get('/public', reportController.getPublicReports);
router.get('/public/download/:id', reportController.downloadPublicReport);

// Admin & Auditor report generation routes
router.get('/summary', reportController.generateSummaryReport);
router.get('/incident', reportController.generateIncidentReport);
router.get('/incident/:id', reportController.generateIncidentReportById);
router.post('/send', reportController.sendReport);

module.exports = router;
