'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Anomaly extends Model {
    static associate(models) {
      // Anomaly belongs to Procurement
      Anomaly.belongsTo(models.Procurement, {
        foreignKey: 'procurement_id',
        as: 'procurement',
        onDelete: 'CASCADE',
      });

      // Anomaly created by Auditor
      Anomaly.belongsTo(models.User, {
        foreignKey: 'auditor_id',
        as: 'auditor',
        onDelete: 'CASCADE',
      });

      // Anomaly assigned to Admin
      Anomaly.belongsTo(models.User, {
        foreignKey: 'assigned_to',
        as: 'assignedAdmin',
        onDelete: 'SET NULL',
      });
    }
  }

  Anomaly.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      procurement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'procurements',
          key: 'id',
        },
      },
      auditor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [3, 255],
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      anomaly_type: {
        type: DataTypes.ENUM(
          'inconsistency',
          'fraud',
          'missing_info',
          'other'
        ),
        defaultValue: 'other',
        allowNull: false,
        validate: {
          isIn: [['inconsistency', 'fraud', 'missing_info', 'other']],
        },
      },
      severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false,
        validate: {
          isIn: [['low', 'medium', 'high', 'critical']],
        },
      },
      evidence: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of flag IDs that support this anomaly',
      },
      status: {
        type: DataTypes.ENUM('open', 'investigating', 'resolved', 'closed'),
        defaultValue: 'open',
        allowNull: false,
        validate: {
          isIn: [['open', 'investigating', 'resolved', 'closed']],
        },
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'Admin assigned to investigate',
      },
      investigation_notes: {
        type: DataTypes.TEXT,
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
      modelName: 'Anomaly',
      tableName: 'anomalies',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['procurement_id'] },
        { fields: ['auditor_id'] },
        { fields: ['status'] },
        { fields: ['severity'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Anomaly;
};
