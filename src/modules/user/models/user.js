// src/modules/user/models/user.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const Role = require('./role');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    avatar_url: {
        type: DataTypes.STRING,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    // role_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     defaultValue: 'user',
    //     references: {
    //         model: 'roles',
    //         key: 'id',
    //     },
    //
    // },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    modified_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'users',
    timestamps: false,
});

// Define the association
User.belongsTo(Role, { foreignKey: 'role_id' });

module.exports = User;