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
}, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define the association
// Role.hasMany(User, { as: 'users' });
// Role.hasMany(User, { foreignKey: 'role_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });


module.exports = Role;