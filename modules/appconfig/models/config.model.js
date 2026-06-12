'use strict';
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  const Config = sequelize.define("Config", {
    alertThreshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.8,
    },
  });

  return Config;
};