const csvToJson = require('../../../utils/fileConverter/csvToJson');
const pdfToJson = require('../../../utils/fileConverter/pdfToJson');
const ModelApiClient = require('../../../utils/modelApis');

const procurementRepo = require('../repository/procurement');
const anomalyRepo = require('../repository/anomaly');

class IngestionService {

    // ================= SINGLE =================
    async processSingle(data) {

        const {userId} = data;
        const formatted = this.format(data);

        console.log("📤 Model Payload:", formatted);

        const prediction = await ModelApiClient.predict(formatted);

        console.log("user id at ingestion ", userId)

        const saved = await procurementRepo.create({
            ...formatted,
            created_by : userId,
            prediction_score: prediction.score,
            is_flagged: prediction.is_anomaly
        });

        if (prediction.is_anomaly) {
            await anomalyRepo.create({
                procurement_id: saved.id,
                score: prediction.score,
                reason: prediction.reason || "Model flagged anomaly"
            });
        }

        return { saved, prediction };
    }

    // ================= CSV BULK (OPTIMIZED) =================
    async processCSV(filePath, userId) {

        const rows = await csvToJson(filePath);

        const formatted = rows.map(row => {
            const clean = this.format(row);
            return {
                ...clean,
                created_by: userId
            };
        });

        console.log("📤 Bulk Model Payload:", formatted);

        const predictions = await ModelApiClient.predictBulk(formatted);

        const finalData = formatted.map((item, i) => ({
            ...item,
            prediction_score: predictions[i].score,
            is_flagged: predictions[i].is_anomaly
        }));

        const saved = await procurementRepo.bulkCreate(finalData);

        // anomalies (batch insert safe)
        const anomalies = [];

        saved.forEach((record, i) => {
            if (predictions[i].is_anomaly) {
                anomalies.push({
                    procurement_id: record.id,
                    score: predictions[i].score,
                    reason: predictions[i].reason || "Bulk anomaly"
                });
            }
        });

        if (anomalies.length) {
            await anomalyRepo.bulkCreate(anomalies);
        }

        return { saved, predictions };
    }

    // ================= PDF =================
    async processPDF(filePath, userId) {

        const pdf = await pdfToJson(filePath);

        const parsed = this.parsePDFText(pdf.text);

        return this.processSingle({
            ...parsed,
            created_by: userId
        });
    }

    // ================= FORMAT (STRICT CLEAN) =================
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
        return {
            country: "UNKNOWN",
            tender_year: 2024,

            bidder_id: "PDF_BIDDER",
            buyer_id: "PDF_BUYER",

            main_cpv_2: "PDF",
            main_cpv_3: "PDF",

            bid_price: 0,
            lot_bidscount: 0,

            singleb: 0,
            bid_isconsortium: 0,
            bid_issubcontracted: 0
        };
    }
}

module.exports = new IngestionService();