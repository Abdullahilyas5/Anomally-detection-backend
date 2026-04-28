

const router = require('express').Router();
const OTPController = require('../controllers/otp.controller');

// Route to request OTP for registration
router.post('/registration-otp', OTPController.requestRegistrationOTP);

// Route to verify OTP
router.post('/verify', OTPController.verifyOTP);

// Route to resend OTP
router.post('/resend', OTPController.resendOTP);

module.exports = router;