const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', reportController.generateSummaryReport);
router.get('/executive', reportController.generateExecutiveReport);
router.get('/compliance', reportController.generateComplianceReport);
router.get('/incident', reportController.generateIncidentReport);
router.get('/incident/:id', reportController.generateIncidentReportById);
router.post('/send', reportController.sendReport);

module.exports = router;
