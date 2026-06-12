const jwt = require("jsonwebtoken");
require("dotenv").config();

class JwtUtil {
    constructor() {
        this.accessSecret = process.env.JWT_SECRET;
        this.refreshSecret = process.env.JWT_REFRESH_SECRET;

        if (!this.accessSecret || !this.refreshSecret) {
            throw new Error("JWT secrets are not defined");
        }
    }

    // =========================
    // 🔐 ACCESS TOKEN (short life)
    // =========================
    generateAccessToken(payload, expiresIn = "15d") {
        try {
            return jwt.sign(payload, this.accessSecret, {
                expiresIn,
            });
        } catch (error) {
            throw new Error(`Access token generation failed: ${error.message}`);
        }
    }

    // =========================
    // 🔐 REFRESH TOKEN (long life)
    // =========================
    generateRefreshToken(payload, expiresIn = "7d") {
        try {
            return jwt.sign(payload, this.refreshSecret, {
                expiresIn,
            });
        } catch (error) {
            throw new Error(`Refresh token generation failed: ${error.message}`);
        }
    }

    // =========================
    // ✅ VERIFY ACCESS TOKEN
    // =========================
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessSecret);
        } catch (error) {
            throw new Error(`Access token invalid: ${error.message}`);
        }
    }

    // =========================
    // ✅ VERIFY REFRESH TOKEN
    // =========================
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.refreshSecret);
        } catch (error) {
            throw new Error(`Refresh token invalid: ${error.message}`);
        }
    }

    // =========================
    // 🧠 BACKWARD COMPATIBILITY (optional)
    // =========================
    createToken(data, expiresIn = "24h") {
        return this.generateAccessToken(data, expiresIn);
    }
}

module.exports = new JwtUtil();