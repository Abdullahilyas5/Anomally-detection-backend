const userService = require('../services/user.service');
const LogService = require('../../logs/services/log.service');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');

class UserController {

    /**
     * Register a new user
     * POST /api/users/register
     */
    async registerUser(req, res, next) {
        try {
            const { name, email, password, role } = req.body;

            console.log('Request body:', req.body);

            const user = await userService.registerUser({
                name,
                email,
                password,
                role: role || 'citizen'
            });

            // Log the registration action
            await LogService.logAction({
                user_id: user.id,
                action: 'USER_REGISTERED',
                entity_type: 'user',
                entity_id: user.id,
                status: 'success',
                severity: 'info',
                ip: req.ip
            });


            console.log('user ip :', req.ip);
            res.status(API_STATUS_CODES.CREATED).json({
                success: true,
                message: 'User registered successfully',
                user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/users/login
     */
    async loginUser(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await userService.loginUser(email, password);

            // Log the login action
            await LogService.logAction({
                userId: result.user.id,
                action: 'USER_LOGIN',
                entityType: 'user',
                entityId: result.user.id,
                status: 'success',
                severity: 'info',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user profile
     * GET /api/users/profile
     */
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await userService.getUserProfile(userId);

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     * PUT /api/users/profile
     */
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name } = req.body;

            const updated = await userService.updateUserProfile(userId, { name });

            // Log the profile update
            await LogService.logAction({
                userId,
                action: 'USER_PROFILE_UPDATED',
                entityType: 'user',
                entityId: userId,
                after_state: { name },
                status: 'success',
                severity: 'info',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Profile updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     * PUT /api/users/change-password
     */
    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { oldPassword, newPassword } = req.body;

            await userService.changePassword(userId, oldPassword, newPassword);

            // Log password change
            await LogService.logAction({
                userId,
                action: 'USER_PASSWORD_CHANGED',
                entityType: 'user',
                entityId: userId,
                status: 'success',
                severity: 'warning',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/users/refresh-token
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            const result = await userService.refreshAccessToken(refreshToken);

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: {
                    accessToken: result.accessToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all users (Admin only)
     * GET /api/users
     */
    async getAllUsers(req, res, next) {
        try {
            const { page = 1, limit = 10, role, status, search } = req.query;

            const result = await userService.getAllUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                role,
                status,
                search
            });

            // Log the search action
            await LogService.logAction({
                userId: req.user.userId,
                action: 'USERS_LIST_ACCESSED',
                entityType: 'user',
                status: 'success',
                severity: 'info',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user by ID (Admin only)
     * GET /api/users/:id
     */
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.getUserProfile(parseInt(id));

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change user role (Admin only)
     * PUT /api/users/:id/role
     */
    async changeUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { newRole } = req.body;

            const updated = await userService.changeUserRole(parseInt(id), newRole);

            // Log role change
            await LogService.logAction({
                userId: req.user.userId,
                action: 'USER_ROLE_CHANGED',
                entityType: 'user',
                entityId: parseInt(id),
                before_state: { role: 'old_role' },
                after_state: { role: newRole },
                status: 'success',
                severity: 'critical',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: `User role changed to ${newRole}`,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change user status (Admin only)
     * PUT /api/users/:id/status
     */
    async changeUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updated = await userService.changeUserStatus(parseInt(id), status);

            // Log status change
            await LogService.logAction({
                userId: req.user.userId,
                action: 'USER_STATUS_CHANGED',
                entityType: 'user',
                entityId: parseInt(id),
                after_state: { status },
                status: 'success',
                severity: status === 'blocked' ? 'critical' : 'warning',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: `User status changed to ${status}`,
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user (Admin only)
     * DELETE /api/users/:id
     */
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            await userService.deleteUser(parseInt(id));

            // Log user deletion
            await LogService.logAction({
                userId: req.user.userId,
                action: 'USER_DELETED',
                entityType: 'user',
                entityId: parseInt(id),
                status: 'success',
                severity: 'critical',
                ip: req.ip
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get users by role (Admin only)
     * GET /api/users/role/:role
     */
    async getUsersByRole(req, res, next) {
        try {
            const { role } = req.params;
            const users = await userService.getUsersByRole(role);

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                data: users,
                count: users.length
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();