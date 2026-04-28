

const db = require('../../../utils/database');
const OTPUtils = require('../../../utils/otp.util');

class OTPRepository {

    async createOTP(userData) {
        const { email, purpose } = userData;
        const otp = OTPUtils.generateOTP();
        const expiresTime = OTPUtils.setOTPExpiry();

        return await db.OTP.create({
            otp,
            email,
            expiresTime,
            isVerified: false,
            purpose: purpose,
            attempts: 0,
        });
    }

    async findValidOTP({ email, otp }) {
        const now = new Date();
        return await db.OTP.findOne({
            where: {
                email,
                otp,
                isVerified: false,
                expiresTime: {
                    [db.Sequelize.Op.gt]: now,
                },
            }
        });
    }

    async markAsVerified(id) {
        return await db.OTP.update(
            { isVerified: true },
            { where: { id } }
        );
    }

    async incrementAttempts(id) {
        return await db.OTP.increment('attempts', { where: { id } });
    }

    async getAttempts(email) {
        const otp = await db.OTP.findOne({
            where: {
                email,
                isVerified: false,
            },
            order: [['createdAt', 'DESC']],
        });
        return otp ? otp.attempts : 0;
    }

    async findLatestOTP(email) {
        return await db.OTP.findOne({
            where: {
                email,
                isVerified: false,
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async deleteByEmail(email) {
        return await db.OTP.destroy({
            where: { email },
        });
    }

    async deleteExpiredAndVerified() {
        const now = new Date();
        return await db.OTP.destroy({
            where: {
                [db.Sequelize.Op.or]: [
                    { expiresTime: { [db.Sequelize.Op.lt]: now } },
                    { isVerified: true },
                ],
            },
        });
    }

    async deleteOlderThan(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return await db.OTP.destroy({
            where: {
                createdAt: { [db.Sequelize.Op.lt]: cutoffDate },
            },
        });
    }
}

module.exports = new OTPRepository();