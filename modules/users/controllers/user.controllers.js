const userService = require('../services/user.service');
const LogService = require('../../logs/services/log.service');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');
const logtypes = require('../../../app/constant/logstype');
const otpService = require('../../otp/services/otp.service')


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
                role: role,
            });

            const userData = {
                email: email,
                purpose: 'registration'
            }

            const otp = await otpService.createOTP(userData);

            // Log registration
            try {
                await LogService.logAction({
                    userId: user?.id || null,
                    userRole: user?.role || null,
                    action: 'USER_REGISTERED',
                    entityType: 'user',
                    entityId: user?.id || null,
                    status: 'success',
                    severity: 'info',
                    ip: req.ip,
                    message: 'New user registered'
                });
            } catch (e) {
                console.error('Failed to log registration:', e);
            }

            res.status(API_STATUS_CODES.CREATED).json({
                success: true,
                message: 'Verify your email , check your mail',
                user,
                setStatus: user.isVerified ? 'verified' : 'pending',
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

            console.log('Login result:', result);

            // Log successful login
            try {
                await LogService.logAction({
                    userId: result.user?.id || null,
                    userRole: result.user?.role || null,
                    action: 'USER_LOGIN',
                    entityType: 'user',
                    entityId: result.user?.id || null,
                    status: 'success',
                    severity: 'info',
                    ip: req.ip,
                    message: 'User logged in'
                });
            } catch (e) {
                console.error('Failed to log login:', e);
            }

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 60 * 60 * 24 * 7 * 1000 // 7 days
            });

            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    setStatus: result.user.isVerified ? 'verified' : 'pending'
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

            // Prevent admins from changing their own role
            const targetId = parseInt(id, 10);
            if (req.user && Number(req.user.userId) === targetId) {
                return res.status(API_STATUS_CODES.FORBIDDEN).json({
                    success: false,
                    message: 'You cannot change your own role'
                });
            }

            const updated = await userService.changeUserRole(targetId, newRole);

            // Log role change
            try {
                await LogService.logAction({
                    userId: req.user.userId,
                    action: 'USER_ROLE_CHANGED',
                    entityType: 'user',
                    entityId: targetId,
                    after_state: { role: newRole },
                    status: 'success',
                    severity: 'critical',
                    ip: req.ip
                });
            } catch (e) {
                console.error('Failed to log role change:', e);
            }

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

            const targetId = parseInt(id, 10);
            // Prevent admins from blocking themselves
            if (req.user && Number(req.user.userId) === targetId) {
                return res.status(API_STATUS_CODES.FORBIDDEN).json({
                    success: false,
                    message: 'You cannot change your own status'
                });
            }

            const updated = await userService.changeUserStatus(targetId, status);

            // Log status change
            try {
                await LogService.logAction({
                    userId: req.user.userId,
                    action: 'USER_STATUS_CHANGED',
                    entityType: 'user',
                    entityId: targetId,
                    after_state: { status },
                    status: 'success',
                    severity: status === 'blocked' ? 'critical' : 'warning',
                    ip: req.ip
                });
            } catch (e) {
                console.error('Failed to log status change:', e);
            }

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

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'Email is required'
                });
            }
            const otpData = await userService.forgotPassword(email);
            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Password reset OTP sent successfully',
                data: {
                    email: otpData.email,
                    expiresAt: otpData.expiresTime
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) {
                return res.status(API_STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    message: 'Email, OTP, and newPassword are required'
                });
            }
            await userService.resetPassword(email, otp, newPassword);
            res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            next(error);
        }
    }


    /**
 * Logout user
 * POST /api/users/logout
 */
    async logoutUser(req, res, next) {
        try {
            const userId = req.user?.userId; // optional (if auth middleware present)

            const refreshToken = req.cookies?.refreshToken;

            await userService.logoutUser(userId, refreshToken);

            // clear refresh token cookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
            });

             res.clearCookie('accessToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
            });

            return res.status(API_STATUS_CODES.SUCCESS).json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            next(error);
        }
    }


}

module.exports = new UserController();