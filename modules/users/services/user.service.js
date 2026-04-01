const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const PasetoUtil = require('../../../utils/paseto.util');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');

class UserService {
    
    /**
     * Register a new user
     * @param {Object} userData - { name, email, password, role }
     * @returns {Promise<Object>} - Registered user without password
     */
    async registerUser(userData) {
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password) {
            throw new AppError(RESPONSE_MESSAGES.FIELD_REQUIRED, API_STATUS_CODES.BAD_REQUEST);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new AppError(RESPONSE_MESSAGES.INVALID_EMAIL, API_STATUS_CODES.BAD_REQUEST);
        }

        // Validate password strength (min 6 characters)
        if (userData.password.length < 6) {
            throw new AppError('Password must be at least 6 characters long', API_STATUS_CODES.BAD_REQUEST);
        }

        // Check if user already exists
        const existingUser = await userRepository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new AppError(RESPONSE_MESSAGES.USER_ALREADY_EXISTS, API_STATUS_CODES.CONFLICT);
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const user = await userRepository.createUser({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || 'citizen'
        });

        return user;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - { user, accessToken, refreshToken }
     */
    async loginUser(email, password) {
        // Validate inputs
        if (!email || !password) {
            throw new AppError(RESPONSE_MESSAGES.FIELD_REQUIRED, API_STATUS_CODES.BAD_REQUEST);
        }

        // Find user by email
        const user = await userRepository.findUserByEmail(email);
        if (!user) {
            throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.UNAUTHORIZED);
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            throw new AppError('Your account has been blocked', API_STATUS_CODES.FORBIDDEN);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError(RESPONSE_MESSAGES.INVALID_EMAIL_OR_PASSWORD, API_STATUS_CODES.UNAUTHORIZED);
        }

        // Update last login
        await userRepository.updateLastLogin(user.id);

        // Create tokens using Paseto
        const pasetoUtil = new PasetoUtil();
        const accessToken = await pasetoUtil.createToken(
            { userId: user.id, email: user.email, role: user.role },
            '1h'
        );
        const refreshToken = await pasetoUtil.createToken(
            { userId: user.id },
            '7d'
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }

    /**
     * Get user profile
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - User profile
     */
    async getUserProfile(userId) {
        const user = await userRepository.findUserByIdSafe(userId);
        if (!user) {
            throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.NOT_FOUND);
        }
        return user;
    }

    /**
     * Update user profile
     * @param {number} userId - User ID
     * @param {Object} updateData - { name, phone }
     * @returns {Promise<Object>} - Updated user
     */
    async updateUserProfile(userId, updateData) {
        // Only allow certain fields to be updated by user
        const allowedFields = { name: true, phone: true };
        const filteredData = {};

        for (const key in updateData) {
            if (allowedFields[key]) {
                filteredData[key] = updateData[key];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            throw new AppError('No valid fields to update', API_STATUS_CODES.BAD_REQUEST);
        }

        return await userRepository.updateUser(userId, filteredData);
    }

    /**
     * Change password
     * @param {number} userId - User ID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<void>}
     */
    async changePassword(userId, oldPassword, newPassword) {
        // Validate inputs
        if (!oldPassword || !newPassword) {
            throw new AppError(RESPONSE_MESSAGES.FIELD_REQUIRED, API_STATUS_CODES.BAD_REQUEST);
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            throw new AppError('New password must be at least 6 characters long', API_STATUS_CODES.BAD_REQUEST);
        }

        // Get user
        const user = await userRepository.findUserById(userId);
        if (!user) {
            throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.NOT_FOUND);
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new AppError('Current password is incorrect', API_STATUS_CODES.UNAUTHORIZED);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await userRepository.updatePassword(userId, hashedPassword);
    }

    /**
     * Get all users (admin only)
     * @param {Object} options - { page, limit, role, status, search }
     * @returns {Promise<Object>}
     */
    async getAllUsers(options = {}) {
        return await userRepository.getAllUsers(options);
    }

    /**
     * Get users by role
     * @param {string} role - User role (admin, auditor, citizen)
     * @returns {Promise<Array>}
     */
    async getUsersByRole(role) {
        const validRoles = ['admin', 'auditor', 'citizen'];
        if (!validRoles.includes(role)) {
            throw new AppError('Invalid role', API_STATUS_CODES.BAD_REQUEST);
        }
        return await userRepository.getUsersByRole(role);
    }

    /**
     * Change user role (admin only)
     * @param {number} userId - User ID
     * @param {string} newRole - New role
     * @returns {Promise<Object>}
     */
    async changeUserRole(userId, newRole) {
        const validRoles = ['admin', 'auditor', 'citizen'];
        if (!validRoles.includes(newRole)) {
            throw new AppError('Invalid role', API_STATUS_CODES.BAD_REQUEST);
        }

        const user = await userRepository.findUserById(userId);
        if (!user) {
            throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.NOT_FOUND);
        }

        return await userRepository.updateUser(userId, { role: newRole });
    }

    /**
     * Change user status (admin only)
     * @param {number} userId - User ID
     * @param {string} status - 'active', 'inactive', or 'blocked'
     * @returns {Promise<Object>}
     */
    async changeUserStatus(userId, status) {
        return await userRepository.changeUserStatus(userId, status);
    }

    /**
     * Delete user (admin only)
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        const user = await userRepository.findUserById(userId);
        if (!user) {
            throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.NOT_FOUND);
        }

        await userRepository.deleteUser(userId);
    }

    /**
     * Verify and refresh access token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} - { accessToken }
     */
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Refresh token required', API_STATUS_CODES.BAD_REQUEST);
        }

        try {
            const pasetoUtil = new PasetoUtil();
            const decoded = await pasetoUtil.verifyToken(refreshToken);

            // Get user
            const user = await userRepository.findUserByIdSafe(decoded.data.userId);
            if (!user) {
                throw new AppError(RESPONSE_MESSAGES.USER_NOT_FOUND, API_STATUS_CODES.NOT_FOUND);
            }

            // Create new access token
            const accessToken = await pasetoUtil.createToken(
                { userId: user.id, email: user.email, role: user.role },
                '1h'
            );

            return { accessToken };
        } catch (error) {
            throw new AppError(RESPONSE_MESSAGES.TOKEN_EXPIRED, API_STATUS_CODES.UNAUTHORIZED);
        }
    }
}

module.exports = new UserService();