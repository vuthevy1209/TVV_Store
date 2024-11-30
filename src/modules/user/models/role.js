// src/modules/user/models/role.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const User = require('./user');


const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.ENUM(['admin', 'user']),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    modified_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'roles',
    timestamps: false,
});

// Define the association
// Role.hasMany(User, { as: 'users' });

module.exports = Role;