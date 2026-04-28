'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      otp: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      expires_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      purpose: {
        type: Sequelize.ENUM('registration', 'password_reset'),
        allowNull: false,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('otp', ['email']);
    await queryInterface.addIndex('otp', ['purpose']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('otp');
  },
};
