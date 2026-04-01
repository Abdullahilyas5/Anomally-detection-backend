'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who performed the action',
      },
      user_role: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'e.g., CREATE_USER, UPLOAD_FILE, FLAG_ROW',
      },
      entity_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'procurement, user, flag, anomaly',
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the entity being acted on',
      },
      before_state: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Previous state before action',
      },
      after_state: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'New state after action',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      severity: {
        type: Sequelize.ENUM('info', 'warning', 'critical'),
        allowNull: false,
        defaultValue: 'info',
      },
      status: {
        type: Sequelize.ENUM('success', 'failure'),
        allowNull: false,
        defaultValue: 'success',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('system_logs', ['user_id']);
    await queryInterface.addIndex('system_logs', ['action']);
    await queryInterface.addIndex('system_logs', ['created_at']);
    await queryInterface.addIndex('system_logs', ['entity_type']);
    await queryInterface.addIndex('system_logs', ['severity']);
  },

  async down(queryInterface, Sequelize) {
    // Drop the table (ENUM types are automatically dropped in MySQL)
    await queryInterface.dropTable('system_logs');
  },
};