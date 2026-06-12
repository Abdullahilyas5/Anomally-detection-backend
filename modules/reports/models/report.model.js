'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
      });
    }
  }

  Report.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      type: {
        type: DataTypes.ENUM('summary', 'incident'),
        allowNull: false,
        validate: {
          isIn: [['summary', 'incident']],
        },
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_name',
      },
      filePath: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_path',
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'is_public',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'created_by',
      },
      filters: {
        type: DataTypes.JSON,
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
      modelName: 'Report',
      tableName: 'reports',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['is_public'] },
        { fields: ['created_by'] },
      ],
    }
  );

  return Report;
};
