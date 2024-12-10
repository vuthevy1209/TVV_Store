
// src/modules/auth/models/session.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');

const Session = sequelize.define('Session', {
    sid: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        allowNull: false,
    },
    expires: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    data: {
        type: DataTypes.STRING(50000),
        allowNull: false,
    },
}, {
    tableName: 'Session', // Custom table name
    timestamps: true, // Includes createdAt and updatedAt
});

module.exports = Session;