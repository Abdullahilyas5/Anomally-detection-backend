const PasetoUtil = require('../../utils/paseto.util');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../app/constant/apistatus');
const AppError = require('../../utils/AppError.util');

/**
 * Middleware to authenticate user via Bearer token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            throw new AppError(RESPONSE_MESSAGES.ACCESS_DENIED, API_STATUS_CODES.UNAUTHORIZED);
        }

        const pasetoUtil = new PasetoUtil();
        const decoded = await pasetoUtil.verifyToken(token);
        
        // Store decoded user info in request
        req.user = {
            userId: decoded.data.userId,
            email: decoded.data.email,
            role: decoded.data.role
        };

        console.log("Authenticated user:", req.user.userId);
        next();
    } catch (error) {
        next(new AppError(RESPONSE_MESSAGES.TOKEN_EXPIRED, API_STATUS_CODES.UNAUTHORIZED));
    }
};

/**
 * Middleware to verify user is admin
 */
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new AppError('Admin access required', API_STATUS_CODES.FORBIDDEN));
    }
    next();
};

/**
 * Middleware to verify user is auditor
 */
const authorizeAuditor = (req, res, next) => {
    if (req.user.role !== 'auditor' && req.user.role !== 'admin') {
        return next(new AppError('Auditor access required', API_STATUS_CODES.FORBIDDEN));
    }
    next();
};

/**
 * Middleware to verify user is citizen
 */
const authorizeCitizen = (req, res, next) => {
    if (req.user.role !== 'citizen' && req.user.role !== 'admin') {
        return next(new AppError('Citizen access required', API_STATUS_CODES.FORBIDDEN));
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeAuditor,
    authorizeCitizen
};
