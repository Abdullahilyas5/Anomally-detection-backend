'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SystemLog extends Model {
    static associate(models) {
      // Log belongs to User
      SystemLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'SET NULL',
      });
    }
  }

  SystemLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'User who performed the action',
      },
      user_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        comment: 'e.g., CREATE_USER, UPLOAD_FILE, FLAG_ROW',
      },
      entity_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'procurement, user, flag, anomaly',
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the entity being acted on',
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      severity: {
        type: DataTypes.ENUM('info', 'warning', 'critical'),
        defaultValue: 'info',
        allowNull: false,
        validate: {
          isIn: [['info', 'warning', 'critical']],
        },
      },
      status: {
        type: DataTypes.ENUM('success', 'failure'),
        defaultValue: 'success',
        allowNull: false,
        validate: {
          isIn: [['success', 'failure']],
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      sequelize,
      modelName: 'SystemLog',
      tableName: 'system_logs',
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
        { fields: ['entity_type'] },
        { fields: ['severity'] },
      ],
    }
  );

  return SystemLog;
};
