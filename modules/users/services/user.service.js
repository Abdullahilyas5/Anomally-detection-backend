const UserRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');
const otpService = require('../../otp/services/otp.service');
const jwtUtil = require('../../../utils/jwt.util');

class UserService {
    constructor() {
        this.userRepository = UserRepository;
    }

    async registerUser(userData) {
        const existingUser = await this.userRepository.findUserByEmail(userData.email);

        if (existingUser) {
            throw new Error('Email already exists');
        }

        userData.password = await bcrypt.hash(userData.password, 10);

        return await this.userRepository.createUser(userData);
    }

    async getAllUsers() {
        return await this.userRepository.getAllUsers();
    }

    async getUserById(id) {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateUser(id, userData) {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new Error('User not found');

        if (userData.email && userData.email !== user.email) {
            const existingUser = await this.userRepository.findUserByEmail(userData.email);
            if (existingUser) throw new Error('Email already exists');
        }

        return await this.userRepository.updateUser(id, userData);
    }

    async deleteUser(id) {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new Error('User not found');

        return await this.userRepository.deleteUser(id);
    }

    async authenticateUser(email, password) {
        const user = await this.userRepository.findUserByEmail(email);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    // 🔐 UPDATED LOGIN (ACCESS + REFRESH TOKENS)
    async loginUser(email, password) {
        const user = await this.authenticateUser(email, password);

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        };

        // Access token (short life)
        const accessToken = jwtUtil.generateAccessToken(payload, "15m");

        // Refresh token (long life)
        const refreshToken = jwtUtil.generateRefreshToken(
            { id: user.id },
            "7d"
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            accessToken,
            refreshToken
        };
    }

    async forgotPassword(email) {
        const user = await this.userRepository.findUserByEmail(email);

        if (!user) {
            throw new AppError(
                'User with this email does not exist',
                API_STATUS_CODES.NOT_FOUND
            );
        }

        const otpRecord = await otpService.createOTP({
            email,
            purpose: 'password_reset'
        });

        return otpRecord;
    }

    async resetPassword(email, otp, newPassword) {
        const user = await this.userRepository.findUserByEmail(email);

        if (!user) {
            throw new AppError('User not found', API_STATUS_CODES.NOT_FOUND);
        }

        const verifiedOTP = await otpService.verifyOTP({ email, otp });

        if (!verifiedOTP) {
            throw new AppError('Invalid or expired OTP', API_STATUS_CODES.BAD_REQUEST);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.updatePassword(user.id, hashedPassword);
        await otpService.markOTPVerified(verifiedOTP.id);

        return user;
    }



    // 🔐 REFRESH TOKEN LOGIC (ADD THIS)
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError("Refresh token missing", 401);
        }

        let decoded;

        try {
            decoded = jwtUtil.verifyRefreshToken(refreshToken);
        } catch (err) {
            throw new AppError("Invalid refresh token", 401);
        }

        const user = await this.userRepository.findUserById(decoded.id);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        // OPTIONAL (production-grade safety)
        // if (user.refreshToken !== refreshToken) {
        //     throw new AppError("Refresh token mismatch", 401);
        // }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        };

        const newAccessToken = jwtUtil.generateAccessToken(payload, "15m");

        return {
            accessToken: newAccessToken
        };
    }


    async changeUserRole(id, newRole) {
        const user = await this.userRepository.findUserById(id);

        if (!user) {
            throw new Error('User not found');
        }

        // Optional: validate allowed roles (recommended)
        const allowedRoles = ['user', 'admin', 'auditor'];
        if (!allowedRoles.includes(newRole)) {
            throw new Error('Invalid role type');
        }

        // Prevent unnecessary DB update
        if (user.role === newRole) {
            return {
                message: 'User already has this role',
                user
            };
        }

        return await this.userRepository.updateUser(id, {
            role: newRole
        });
    }

    async changeUserStatus(id, newStatus) {
        const user = await this.userRepository.findUserById(id);

        if (!user) {
            throw new Error('User not found');
        }

        const allowedStatuses = ['active', 'inactive', 'blocked'];

        if (!allowedStatuses.includes(newStatus)) {
            throw new Error('Invalid status type');
        }

        if (user.status === newStatus) {
            return {
                message: 'User already has this status',
                user
            };
        }

        return await this.userRepository.updateUser(id, {
            status: newStatus
        });
    }

}

module.exports = new UserService();