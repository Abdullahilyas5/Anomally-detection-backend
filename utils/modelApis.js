require('dotenv').config();
const axios = require("axios");
const { configDotenv } = require("dotenv");

const MODEL_BASE_URL = process.env.MODEL_BASE_URL || "http://localhost:8000";

/**
 * ML Model API Client
 */
class ModelApiClient {

    /**
     * Single prediction
     */
    static async predict(payload) {
        try {
            const res = await axios.post(
                `${MODEL_BASE_URL}/predict`,
                payload
            );
            return res.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || error.message
            );
        }
    }

    /**
     * Bulk prediction
     */
    static async predictBulk(payloadArray) {
        try {
            const res = await axios.post(
                `${MODEL_BASE_URL}/predict_bulk`,
                payloadArray
            );
            return res.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message || error.message
            );
        }
    }
}

module.exports = ModelApiClient;