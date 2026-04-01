
const { V4, SecretKey } = require('paseto');
require('dotenv').config();

class PasetoUtil {
    constructor(secret) {
        this.secret = secret || process.env.PASETO_SECRET;
        if (!this.secret) {
            throw new Error('PASETO_SECRET is not defined');
        }
    }

    async generateToken(payload, expiresIn = '1h') {
        try {
            const key = await SecretKey.create(this.secret);
            const token = await V4.encrypt(payload, key);
            return token;
        } catch (error) {
            throw new Error(`Token generation failed: ${error.message}`);
        }
    }

    async verifyToken(token) {
        try {
            const key = await SecretKey.create(this.secret);
            const payload = await V4.decrypt(token, key);
            return payload;
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    async createToken(data, expiresIn = '24h') {
        const payload = {
            data,
            iat: new Date(),
            exp: new Date(Date.now() + this.parseExpiry(expiresIn)),
        };
        return this.generateToken(payload);
    }

    parseExpiry(expiresIn) {
        const match = expiresIn.match(/(\d+)([smhd])/);
        if (!match) throw new Error('Invalid expiry format');
        const [, amount, unit] = match;
        const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        return parseInt(amount) * units[unit];
    }
}

module.exports = PasetoUtil;