const UserRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');
const AppError = require('../../../utils/AppError.util');
const LogService = require('../../logs/services/log.service');
const OTPUtils = require('../../../utils/otp.util');
const otpService = require('../../otp/services/otp.service')

class UserService {
    constructor() {
        this.userRepository = UserRepository;
    }

    async registerUser(userData) {
        // Check if email already exists
        const existingUser = await this.userRepository.findUserByEmail(userData.email);

        if (existingUser) {
            throw new Error('Email already exists');
        }

        userData.password = await bcrypt.hash(userData.password, 10);

        console.log('Registering user with data:', userData);


        return await this.userRepository.createUser(userData);
    }

    async getAllUsers() {
        return await this.userRepository.getAllUsers();
    }

    async getUserById(id) {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async getUserByEmail(email) {
        return await this.userRepository.findUserByEmail(email);
    }

    async updateUser(id, userData) {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if email is being changed and if it's already taken
        if (userData.email && userData.email !== user.email) {
            const existingUser = await this.userRepository.findUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email already exists');
            }
        }

        return await this.userRepository.updateUser(id, userData);
    }

    async deleteUser(id) {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
            throw new Error('User not found');
        }

        return await this.userRepository.deleteUser(id);
    }

    async authenticateUser(email, password) {
        const user = await this.userRepository.findUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password (would typically use bcrypt.compare here)
        // const isValid = await bcrypt.compare(password, user.password);
        const isValid = password === user.password;

        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    async loginUser(email, password) {
        const user = await this.authenticateUser(email, password);

        return { user, token };
    }

    


}

module.exports = new UserService();