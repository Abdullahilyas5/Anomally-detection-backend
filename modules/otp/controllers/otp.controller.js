

const OTPservice = require('../services/otp.service');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const UserService = require("../../users/services/user.service");
const userRepository = require('../../users/repositories/user.repository');

class OTPController {

    async requestRegistrationOTP(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'Email is required',
                });
            }

            // Check if user already exists
            const existingUser = await userRepository.findUserByEmail(email);
            if (existingUser && existingUser.isVerified) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'User is already verified',
                });
            }

            const otpData = await OTPservice.createOTP({ email, purpose: 'registration' });

            res.status(API_STATUS_CODES.CREATED).json({
                success: true,
                message: 'OTP sent successfully',
                data: {
                    email: otpData.email,
                    expiresAt: otpData.expiresTime,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyOTP(req, res, next) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'Email and OTP are required',
                });
            }

            // Find user by email first
            const user = await userRepository.findUserByEmail(email);
            
            if (!user) {
                return res.status(API_STATUS_CODES.NOT_FOUND).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Check if already verified
            if (user.isVerified) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'User is already verified',
                });
            }

            const result = await OTPservice.verifyOTP({ email, otp });

            if (!result) {
                const remainingAttempts = await OTPservice.getRemainingAttempts(email);
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid or expired OTP. ${remainingAttempts} attempts remaining.`,
                });
            }

            await OTPservice.markOTPVerified(result.id);
            await userRepository.markUserVerified(user.id, { isVerified: true });

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: 'OTP verified successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async resendOTP(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'Email is required',
                });
            }

            // Check if user exists
            const user = await userRepository.findUserByEmail(email);
            if (!user) {
                return res.status(API_STATUS_CODES.NOT_FOUND).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Check if already verified
            if (user.isVerified) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'User is already verified',
                });
            }

            const otpData = await OTPservice.resendOTP({ email, purpose: 'registration' });

            res.status(API_STATUS_CODES.OK).json({
                success: true,
                message: 'OTP resent successfully',
                data: {
                    email: otpData.email,
                    expiresAt: otpData.expiresTime,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OTPController();
