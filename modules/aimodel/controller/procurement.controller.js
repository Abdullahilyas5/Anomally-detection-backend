const ingestionService = require('../service/ingestion.service');
const procurementService = require('../service/procurement.service');
const LogService = require('../../logs/services/log.service');

class ProcurementController {

    // ---------------- MANUAL ----------------
    async manualPredict(req, res) {
        try {
            const userId = req.user.userId;

            console.log("userId at the controller : ", userId)

            console.log("Body come from the frontend : " , req.body);

            const result = await ingestionService.processSingle({
                ...req.body,
                userId
            });

            // Log procurement prediction/ingestion
            try {
                await LogService.logAction({
                    userId,
                    userRole: req.user?.role || null,
                    action: 'PROCUREMENT_PREDICTED',
                    entityType: 'procurement',
                    entityId: result?.id || null,
                    status: 'success',
                    severity: 'info',
                    ip: req.ip,
                    message: 'Manual procurement prediction/ingestion'
                });
            } catch (e) {
                console.error('Failed to log procurement prediction:', e);
            }

            res.status(201).json({
                success: true,
                data: result
            });

        } catch (err) {
            console.log("error in single procurement" , err );
            res.status(500).json({ error: err.message });
        }
    }

    // ---------------- CSV ----------------
    async predictCSV(req, res) {
        try {
            const userId = req.user.userId;
            console.log("file path : " , req.file.path);

            const result = await ingestionService.processCSV(
                req.file.path,
                userId
            );

            // Log CSV ingestion
            try {
                await LogService.logAction({
                    userId,
                    userRole: req.user?.role || null,
                    action: 'PROCUREMENT_CSV_INGESTED',
                    entityType: 'procurement',
                    entityId: null,
                    status: 'success',
                    severity: 'info',
                    ip: req.ip,
                    message: 'Procurement CSV ingested'
                });
            } catch (e) {
                console.error('Failed to log CSV ingestion:', e);
            }

            res.json({
                success: true,
                data: result
            });

        } catch (err) {
            console.log("proc/contro : error from the csv" , err)
            res.status(500).json({ error: err.message });
        }
    }

    // ---------------- PDF ----------------
    async predictPDF(req, res) {
        try {
            const userId = req.user.userId;

            const result = await ingestionService.processPDF(
                req.file.path,
                userId
            );

            // Log PDF ingestion
            try {
                await LogService.logAction({
                    userId,
                    userRole: req.user?.role || null,
                    action: 'PROCUREMENT_PDF_INGESTED',
                    entityType: 'procurement',
                    entityId: null,
                    status: 'success',
                    severity: 'info',
                    ip: req.ip,
                    message: 'Procurement PDF ingested'
                });
            } catch (e) {
                console.error('Failed to log PDF ingestion:', e);
            }

            res.json({
                success: true,
                data: result
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ---------------- GET ----------------
    async get(req, res) {
        try {
            const data = await procurementService.getProcurement(req.params.id);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }


    async getall(req, res) {
        try {
            const data = await procurementService.getallProcurement();
            console.log("data in controller:" , data)
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }



}

module.exports = new ProcurementController();