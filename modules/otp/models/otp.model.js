'use strict';
const { DataTypes, Model } = require('sequelize');


module.exports = (sequelize) => {

    class OTP extends Model {
        static associate(models) {
          
            OTP.belongsTo(models.User, {
                foreignKey: 'email',
                targetKey: 'email',
                as: 'user',
            })
        }
    }

    OTP.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expiresTime: {
            type: DataTypes.DATE,
            field: 'expires_time',
        },
        purpose: {
            type: DataTypes.ENUM('registration', 'password_reset'),
            allowNull: false,
        },
        attemps: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'attempts',
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_verified',
        }
    }, {
        sequelize,
        modelName: 'OTP',
        tableName: 'otp',
        underscored: true,
    });

    return OTP;
}