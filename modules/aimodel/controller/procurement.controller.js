const ingestionService = require('../service/ingestion.service');
const procurementService = require('../service/procurement.service');

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
            const userId = req.user.id;

            const result = await ingestionService.processCSV(
                req.file.path,
                userId
            );

            res.json({
                success: true,
                data: result
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ---------------- PDF ----------------
    async predictPDF(req, res) {
        try {
            const userId = req.user.id;

            const result = await ingestionService.processPDF(
                req.file.path,
                userId
            );

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