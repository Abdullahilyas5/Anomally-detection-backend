'use strict';
const { Model, DataTypes } = require('sequelize');



module.exports = (sequelize) => {
  class Procurement extends Model {
    static associate(models) {


      Procurement.hasMany(models.Anomaly, {
        foreignKey: 'procurement_id',
        as: 'anomalies',
        onDelete: 'CASCADE'
      });


      Procurement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'CASCADE',
      });
    }
  }

  Procurement.init(
    {
      // ================= FILE INFO =================
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      title: DataTypes.STRING,
      file_name: DataTypes.STRING,
      file_url: DataTypes.STRING,
      file_type: DataTypes.ENUM('pdf', 'csv'),
      file_size: DataTypes.INTEGER,
      total_rows: DataTypes.INTEGER,

      status: {
        type: DataTypes.ENUM('pending', 'flagged', 'approved', 'rejected'),
        defaultValue: 'pending',
      },

      flag_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      risk_level: {
        type: DataTypes.STRING
      },

      // ================= ML FEATURES =================
      country: DataTypes.STRING,
      tender_year: DataTypes.INTEGER,

      bidder_id: DataTypes.STRING,
      buyer_id: DataTypes.STRING,

      main_cpv_2: DataTypes.STRING,
      main_cpv_3: DataTypes.STRING,

      bid_price: DataTypes.FLOAT,
      lot_bidscount: DataTypes.INTEGER,

      singleb: DataTypes.INTEGER,
      bid_isconsortium: DataTypes.INTEGER,
      bid_issubcontracted: DataTypes.INTEGER,

      // ================= MODEL OUTPUT =================
      prediction_score: DataTypes.FLOAT,
      is_flagged: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Procurement',
      tableName: 'procurements',
      timestamps: true,
      underscored: true,
    }
  );

  return Procurement;
};