const csvToJson = require('../../../utils/fileConverter/csvToJson');
const pdfToJson = require('../../../utils/fileConverter/pdfToJson');
const ModelApiClient = require('../../../utils/modelApis');

const procurementRepo = require('../repository/procurement');
const anomalyRepo = require('../repository/anomaly');

const getAnomalyType = (reason = '') => {
    const normalized = String(reason).toLowerCase();

    if (normalized.includes('price') || normalized.includes('spike')) return 'price_spike';
    if (normalized.includes('duplicate') || normalized.includes('repeated bid')) return 'duplicate_bid';
    if (normalized.includes('rigging') || normalized.includes('cartel')) return 'bid_rigging';
    if (normalized.includes('vendor') || normalized.includes('supplier')) return 'vendor_dominance';
    if (normalized.includes('missing') || normalized.includes('incomplete')) return 'missing_information';
    if (normalized.includes('fraud')) return 'fraud';
    return 'inconsistency';
};

class IngestionService {

    // ================= SINGLE =================
    async processSingle(data) {

        const { userId } = data;
        const formatted = this.format(data);

        const prediction = await ModelApiClient.predict(formatted);

        const saved = await procurementRepo.create({
            ...formatted,
            created_by: userId,
            prediction_score: prediction.risk_score,
            risk_level: prediction.risk_level,
        });

        if (prediction.is_anomaly) {
            const reason = prediction.reason || "Model flagged anomaly";
            await anomalyRepo.create({
                procurement_id: saved.id,
                title: reason,
                description: reason,
                anomaly_type: getAnomalyType(reason),
                score: prediction.risk_score,
                risk_level: prediction.risk_level,
            });
        }

        return { saved, prediction };
    }

    // ================= CSV BULK =================
    async processCSV(filePath, userId) {

        const rows = await csvToJson(filePath);

        const formatted = rows.map(row => ({
            ...this.format(row),
            created_by: userId
        }));

        const predictions = await ModelApiClient.predictBulk(formatted);

        const finalData = formatted.map((item, i) => ({
            ...item,
            prediction_score: predictions[i].risk_score,
            risk_level: predictions[i].risk_level
        }));

        // Batch bulk create to avoid very large single inserts and high memory/DB pressure
        const BATCH_SIZE = 100;
        const saved = [];

        for (let i = 0; i < finalData.length; i += BATCH_SIZE) {
            const batch = finalData.slice(i, i + BATCH_SIZE);
            const batchSaved = await procurementRepo.bulkCreate(batch);
            // procurementRepo.bulkCreate expected to return created records for the batch
            saved.push(...batchSaved);
        }

        const anomalies = saved
            .map((record, i) => {
                if (!predictions[i].is_anomaly) return null;

                return {
                    procurement_id: record.id,
                    title: predictions[i].reason || "Bulk anomaly",
                    description: predictions[i].reason || "Bulk anomaly",
                    anomaly_type: getAnomalyType(predictions[i].reason),
                    score: predictions[i].risk_score,
                    risk_level: predictions[i].risk_level,
                };
            })
            .filter(Boolean);

        if (anomalies.length) {
            // Also create anomalies in batches
            for (let i = 0; i < anomalies.length; i += BATCH_SIZE) {
                const batch = anomalies.slice(i, i + BATCH_SIZE);
                await anomalyRepo.bulkCreate(batch);
            }
        }

        return { saved, predictions };
    }

    // ================= PDF =================
    async processPDF(filePath, userId) {

        const pdfData = await pdfToJson(filePath);

        const rows = this.parsePDFText(pdfData.text);

        if (!rows.length) {
            throw new Error("No valid records found in PDF");
        }

        const modelInput = rows.map(row => this.format(row));

        const predictions = await ModelApiClient.predictBulk(modelInput);

        const finalData = modelInput.map((item, i) => ({
            ...item,
            created_by: userId,
            prediction_score: predictions[i].risk_score,
            risk_level: predictions[i].risk_level,
            is_flagged: predictions[i].is_anomaly
        }));

        // Batch insert to avoid massive single query
        const BATCH_SIZE = 100;
        const saved = [];

        for (let i = 0; i < finalData.length; i += BATCH_SIZE) {
            const batch = finalData.slice(i, i + BATCH_SIZE);
            const batchSaved = await procurementRepo.bulkCreate(batch);
            saved.push(...batchSaved);
        }

        const anomalies = saved
            .map((record, i) => {
                if (!predictions[i].is_anomaly) return null;

                return {
                    procurement_id: record.id,
                    title: predictions[i].reason || "PDF bulk anomaly",
                    description: predictions[i].reason || "PDF bulk anomaly",
                    anomaly_type: getAnomalyType(predictions[i].reason),
                    score: predictions[i].risk_score,
                    risk_level: predictions[i].risk_level,
                };
            })
            .filter(Boolean);

        if (anomalies.length) {
            for (let i = 0; i < anomalies.length; i += BATCH_SIZE) {
                const batch = anomalies.slice(i, i + BATCH_SIZE);
                await anomalyRepo.bulkCreate(batch);
            }
        }

        return { saved, predictions };
    }

    // ================= FORMAT =================
    format(data) {
        return {
            created_by: data.created_by,
            country: data.country,
            tender_year: Number(data.tender_year),

            bidder_id: data.bidder_id,
            buyer_id: data.buyer_id,

            main_cpv_2: data.main_cpv_2,
            main_cpv_3: data.main_cpv_3,

            bid_price: Number(data.bid_price),
            lot_bidscount: Number(data.lot_bidscount),

            singleb: Number(data.singleb),
            bid_isconsortium: Number(data.bid_isconsortium),
            bid_issubcontracted: Number(data.bid_issubcontracted)
        };
    }

    // ================= PDF PARSER =================
    parsePDFText(text) {
        const lines = text
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean);

        const rows = [];

        for (const line of lines) {

            if (line.length < 10) continue;

            const parts = line.split(/\s{2,}|\t|,/);

            rows.push({
                country: parts[0] || "UNKNOWN",
                tender_year: Number(parts[1]) || 2024,

                bidder_id: parts[2] || "PDF_BIDDER",
                buyer_id: parts[3] || "PDF_BUYER",

                main_cpv_2: parts[4] || "PDF",
                main_cpv_3: parts[5] || "PDF",

                bid_price: Number(parts[6]) || 0,
                lot_bidscount: Number(parts[7]) || 0,

                singleb: Number(parts[8]) || 0,
                bid_isconsortium: Number(parts[9]) || 0,
                bid_issubcontracted: Number(parts[10]) || 0
            });
        }

        return rows;
    }
}

module.exports = new IngestionService();