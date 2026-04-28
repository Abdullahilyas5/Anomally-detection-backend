require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../app/constant/apistatus');
const AppError = require('./AppError.util');

// In-memory storage for OTPs
const otpStorage = new Map();

class OTPUtils {
    // Generate a 4-digit OTP
    static generateOTP() {
        return crypto.randomInt(1000, 9999).toString();
    }

    // Check if an OTP has expired
    static isOTPExpired(expiryTime) {
        return new Date() > new Date(expiryTime);
    }

    // Set OTP expiry (5 minutes)
    static setOTPExpiry() {
        return new Date(Date.now() + 5 * 60 * 1000);
    }

    // Store OTP for an email
    static storeOTP(email, otp) {
        otpStorage.set(email, {
            otp,
            expiryTime: this.setOTPExpiry(),
            isVerified: false,
        });
    }

    // Retrieve OTP data
    static getOTP(email) {
        const data = otpStorage.get(email);
        if (!data) return null;
        if (this.isOTPExpired(data.expiryTime)) {
            otpStorage.delete(email);
            return null;
        }
        return data;
    }

    // Verify OTP
    static verifyOTP(email, otp) {
        const data = this.getOTP(email);
        return data && data.otp === otp;
    }

    // Mark OTP as verified
    static markOTPVerified(email) {
        const data = otpStorage.get(email);
        if (data) {
            data.isVerified = true;
            otpStorage.set(email, data);
        }
    }

    // Check verification status
    static isOTPVerified(email) {
        const data = this.getOTP(email);
        return data ? data.isVerified : false;
    }

    // Remove OTP entry
    static removeOTP(email) {
        otpStorage.delete(email);
    }

    // Cleanup expired OTPs
    static cleanupExpiredOTPs() {
        for (const [email, otpData] of otpStorage.entries()) {
            if (this.isOTPExpired(otpData.expiryTime)) {
                otpStorage.delete(email);
            }
        }
    }

    // Send OTP Email using OAuth2 (client ID, secret, refresh token)
    static async sendOtpEmail(email, otp, purpose = 'registration') {
        try {
            // Create OAuth2 client
            const oAuth2Client = new google.auth.OAuth2(
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET,
                'https://developers.google.com/oauthplayground'
            );
            console.log("Checking ENV vars:");
            console.log("CLIENT_ID:", !!process.env.CLIENT_ID);
            console.log("CLIENT_SECRET:", !!process.env.CLIENT_SECRET);
            console.log("REFRESH_TOKEN:", !!process.env.REFRESH_TOKEN);
            
            oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

            // Obtain access token
            const accessTokenObj = await oAuth2Client.getAccessToken();
            const accessToken = accessTokenObj && accessTokenObj.token ? accessTokenObj.token : null;
            if (!accessToken) {
                throw new Error('Failed to obtain access token from refresh token');
            }

            // Create Nodemailer transporter using OAuth2
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.EMAIL_USER,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    refreshToken: process.env.REFRESH_TOKEN,
                    accessToken,
                },
            });

            console.log('Nodemailer OAuth2 transporter created for', process.env.EMAIL_USER);
            console.log('Sending OTP to:', email);

            const subject = purpose === 'registration' ? 'Registration OTP' : 'Password Reset OTP';
            const message = purpose === 'registration'
                ? `Your OTP for registration is: ${otp}\n\nThis OTP will expire in 5 minutes.`
                : `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 5 minutes.`;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject,
                text: message,
            });

            console.log('OTP email sent successfully');
            return RESPONSE_MESSAGES.EMAIL_SEND_SUCCESS;
        } catch (error) {
            console.error('Error sending OTP email via OAuth2:', error);
            throw new AppError(RESPONSE_MESSAGES.EMAIL_SEND_FAILED, API_STATUS_CODES.ERROR_CODE);
        }
    }

    // Validate OTP format (4 digits)
    static validateOTPFormat(otp) {
        return /^\d{4}$/.test(otp);
    }
}

// Periodic cleanup every 5 minutes
setInterval(() => {
    OTPUtils.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

module.exports = OTPUtils;