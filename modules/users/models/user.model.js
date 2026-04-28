'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Each user can have many system logs
      User.hasMany(models.SystemLog, {
        foreignKey: 'user_id',
        as: 'logs',
        onDelete: 'SET NULL',
      });

      User.hasMany(models.OTP, {
        foreignKey: 'email',
        sourceKey: 'email',
        as: 'otps',
      })

    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [2, 255],
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          msg: 'Email already exists',
        },
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [6, 255],
          notEmpty: true,
        },
      },
      role: {
        type: DataTypes.ENUM('citizen', 'auditor', 'admin'),
        defaultValue: 'citizen',
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'blocked'),
        defaultValue: 'active',
        allowNull: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['status'] },
      ],
    }
  );

  /**
   * Helper Methods
   */
  User.prototype.toJSON = function () {
    const { password, ...user } = this.get();
    return user;
  };

  return User;
};
