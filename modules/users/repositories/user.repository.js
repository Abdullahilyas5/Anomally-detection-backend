const db = require('../../../utils/database');
const AppError = require('../../../utils/AppError.util');
const { RESPONSE_MESSAGES, API_STATUS_CODES } = require('../../../app/constant/apistatus');

const User = db.User;

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - { name, email, password, role }
   * @returns {Promise<Object>} - Created user object (without password)
   */

  async createUser(userData) {
    try {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'citizen',
        status: userData.role === 'citizen' ? 'active' : 'inactive',
        isVerified: userData.isVerified || false,
      });

      return user.toJSON();
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError(
          RESPONSE_MESSAGES.USER_ALREADY_EXISTS,
          API_STATUS_CODES.CONFLICT
        );
      }
      throw error;
    }
  }


  async markUserVerified(id, { isVerified }) {
    const user = await this.findUserById(id);

    if (!user) {
      throw new AppError(
        RESPONSE_MESSAGES.USER_NOT_FOUND,
        API_STATUS_CODES.NOT_FOUND
      )
    }

    // Update the User table, not OTP table
    const updatedUser = await User.update(
      { isVerified },
      {
        where: { id }
      }
    )
    return updatedUser;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null
   */
  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null
   */
  async findUserById(id) {
    try {
      const user = await User.findByPk(id);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID without password
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object without password
   */
  async findUserByIdSafe(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} options - { page, limit, role, status, search }
   * @returns {Promise<Object>} - { users, total, page, limit }
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, role, status, search } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause = {};

      if (role) whereClause.role = role;
      if (status) whereClause.status = status;

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        offset,
        limit,
        order: [['createdAt', 'DESC']],
      });

      // If search is provided, filter in memory (for simplicity)
      let filteredRows = rows;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRows = rows.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }

      return {
        users: filteredRows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, updateData) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      const allowedFields = ['name', 'role', 'status'];
      const filteredData = {};

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      await user.update(filteredData);
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} hashedPassword - New hashed password
   * @returns {Promise<void>}
   */
  async updatePassword(id, hashedPassword) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      await user.update({ password: hashedPassword });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update last login time
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    try {
      const user = await User.findByPk(id);
      if (user) {
        await user.update({ last_login: new Date() });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      await user.destroy();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: ['id'],
      });
      return !!user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role (citizen, auditor, admin)
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role) {
    try {
      const users = await User.findAll({
        where: { role, status: 'active' },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });
      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user count by role
   * @param {string} role - User role (citizen, auditor, admin)
   * @returns {Promise<number>}
   */
  async getUserCountByRole(role) {
    try {
      const count = await User.count({ where: { role } });
      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Block user
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async blockUser(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      await user.update({ status: 'blocked' });
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unblock user
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async unblockUser(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      await user.update({ status: 'active' });
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user status
   * @param {number} id - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async changeUserStatus(id, status) {
    try {
      const validStatuses = ['active', 'inactive', 'blocked'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', API_STATUS_CODES.BAD_REQUEST);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError(
          RESPONSE_MESSAGES.USER_NOT_FOUND,
          API_STATUS_CODES.NOT_FOUND
        );
      }

      await user.update({ status });
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
