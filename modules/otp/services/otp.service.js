

const OTPRepository = require('../repositories/otp.repository');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');
const OTPUtils = require('../../../utils/otp.util');

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown between resends

class OTPservice {

    async createOTP(userData) {
        // Delete any existing OTPs for this email before creating new one
        await OTPRepository.deleteByEmail(userData.email);
        
        const otpRecord = await OTPRepository.createOTP(userData);
        
        // Send OTP via email
        try {
            await OTPUtils.sendOtpEmail(userData.email, otpRecord.otp, userData.purpose);
            console.log(`OTP email sent to ${userData.email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Don't throw - still return the OTP record, email failure is logged
        }
        
        return otpRecord;
    }

    async verifyOTP({ email, otp }) {
        const dbOTP = await OTPRepository.findValidOTP({ email, otp });
        
        if (!dbOTP) {
            // Check if there's an OTP record to increment attempts
            const existingOTP = await OTPRepository.findLatestOTP(email);
            if (existingOTP) {
                await OTPRepository.incrementAttempts(existingOTP.id);
                const attempts = existingOTP.attempts + 1;
                
                if (attempts >= MAX_ATTEMPTS) {
                    throw new AppError(
                        'Too many failed attempts. Please request a new OTP.',
                        API_STATUS_CODES.TOO_MANY_REQUESTS
                    );
                }
            }
            return null;
        }
        
        return dbOTP;
    }

    async markOTPVerified(id) {
        return await OTPRepository.markAsVerified(id);
    }

    async resendOTP({ email, purpose }) {
        // Check for recent OTP to enforce cooldown
        const latestOTP = await OTPRepository.findLatestOTP(email);
        
        if (latestOTP) {
            const timeSinceLastOTP = (Date.now() - new Date(latestOTP.createdAt).getTime()) / 1000;
            
            if (timeSinceLastOTP < RESEND_COOLDOWN_SECONDS) {
                const remainingTime = RESEND_COOLDOWN_SECONDS - Math.floor(timeSinceLastOTP);
                throw new AppError(
                    `Please wait ${remainingTime} seconds before requesting another OTP.`,
                    API_STATUS_CODES.TOO_MANY_REQUESTS
                );
            }
        }

        // Create new OTP (deletes old ones automatically)
        const otpData = await this.createOTP({ email, purpose });
        return otpData;
    }

    async getRemainingAttempts(email) {
        const latestOTP = await OTPRepository.findLatestOTP(email);
        if (!latestOTP) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - latestOTP.attempts);
    }
}

module.exports = new OTPservice();
