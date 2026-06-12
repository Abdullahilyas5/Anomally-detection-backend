const JWTUtils = require('../../utils/jwt.util.js');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../app/constant/apistatus');
const AppError = require('../../utils/AppError.util');

/**
 * Authenticate user via Bearer token
 */
const authenticateToken = async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        } else if (req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                const parts = cookie.split('=');
                acc[parts[0].trim()] = (parts[1] || '').trim();
                return acc;
            }, {});
            token = cookies.accessToken || cookies.token;
        }

        if (!token) {
            return next(
                new AppError(
                    RESPONSE_MESSAGES.ACCESS_DENIED || 'Access denied',
                    API_STATUS_CODES.UNAUTHORIZED
                )
            );
        }

        const decoded = await JWTUtils.verifyAccessToken(token);

        if (!decoded) {
            return next(
                new AppError(
                    'Invalid token',
                    API_STATUS_CODES.UNAUTHORIZED
                )
            );
        }

        // Support both payload structures
        const payload = decoded.data || decoded;

        req.user = {
            userId: payload.id || payload.userId,
            email: payload.email,
            role: payload.role
        };

        if (!req.user.userId) {
            return next(
                new AppError(
                    'Invalid token payload',
                    API_STATUS_CODES.UNAUTHORIZED
                )
            );
        }

        console.log('Authenticated user:', req.user.userId);

        next();
    } catch (error) {
        console.error('Auth error:', error.message);

        return next(
            new AppError(
                error.name === 'TokenExpiredError'
                    ? 'Token expired'
                    : 'Invalid token',
                API_STATUS_CODES.UNAUTHORIZED
            )
        );
    }
};

/**
 * Allow only admin users
 */
const authorizeAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return next(
                new AppError(
                    'Unauthorized',
                    API_STATUS_CODES.UNAUTHORIZED
                )
            );
        }

        if (req.user.role !== 'admin') {
            return next(
                new AppError(
                    'Admin access required',
                    API_STATUS_CODES.FORBIDDEN
                )
            );
        }

        next();
    } catch (error) {
        return next(
            new AppError(
                'Authorization failed',
                API_STATUS_CODES.FORBIDDEN
            )
        );
    }
};

module.exports = {
    authenticateToken,
    authorizeAdmin
};