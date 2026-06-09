'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProcurementFlag extends Model {
    static associate(models) {
      // Flag belongs to Procurement
      ProcurementFlag.belongsTo(models.Procurement, {
        foreignKey: 'procurement_id',
        as: 'procurement',
        onDelete: 'CASCADE',
      });

      // Flag created by Auditor
      ProcurementFlag.belongsTo(models.User, {
        foreignKey: 'auditor_id',
        as: 'auditor',
        onDelete: 'CASCADE',
      });

      // Flag resolved by Admin
      ProcurementFlag.belongsTo(models.User, {
        foreignKey: 'resolved_by',
        as: 'resolver',
        onDelete: 'SET NULL',
      });
    }
  }

  ProcurementFlag.init(
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
      row_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For CSV row-by-row flagging',
      },
      column_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Which column in CSV is flagged',
      },
      flag_type: {
        type: DataTypes.ENUM('error', 'warning', 'suspicious'),
        defaultValue: 'warning',
        allowNull: false,
        validate: {
          isIn: [['error', 'warning', 'suspicious']],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'resolved'),
        defaultValue: 'pending',
        allowNull: false,
        validate: {
          isIn: [['pending', 'resolved']],
        },
      },
      resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'Admin who resolved the flag',
      },
      resolution_notes: {
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
      modelName: 'ProcurementFlag',
      tableName: 'procurement_flags',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['procurement_id'] },
        { fields: ['auditor_id'] },
        { fields: ['status'] },
        { fields: ['flag_type'] },
      ],
    }
  );

  return ProcurementFlag;
};
