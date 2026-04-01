'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Procurement extends Model {
    static associate(models) {
      // Procurement belongs to User (citizen)
      Procurement.belongsTo(models.User, {
        foreignKey: 'citizen_id',
        as: 'citizen',
        onDelete: 'CASCADE',
      });

      // Procurement can have many flags
      Procurement.hasMany(models.ProcurementFlag, {
        foreignKey: 'procurement_id',
        as: 'flags',
        onDelete: 'CASCADE',
      });

      // Procurement can have many anomalies
      Procurement.hasMany(models.Anomaly, {
        foreignKey: 'procurement_id',
        as: 'anomalies',
        onDelete: 'CASCADE',
      });
    }
  }

  Procurement.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      citizen_id: {
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
        allowNull: true,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          isUrl: true,
          notEmpty: true,
        },
      },
      file_type: {
        type: DataTypes.ENUM('pdf', 'csv'),
        allowNull: false,
        validate: {
          isIn: [['pdf', 'csv']],
        },
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      total_rows: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For CSV files - number of data rows',
      },
      status: {
        type: DataTypes.ENUM('pending', 'flagged', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      flag_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      modelName: 'Procurement',
      tableName: 'procurements',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['citizen_id'] },
        { fields: ['status'] },
        { fields: ['file_type'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Procurement;
};
