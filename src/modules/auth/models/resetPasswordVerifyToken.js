const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const User = require('../../user/models/user');

const ResetPasswordVerifyToken = sequelize.define('ResetPasswordVerifyToken', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Assumes you have a User model
            key: 'id'
        }
    },
    token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    }
}, {
    tableName: 'reset_password_verify_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

ResetPasswordVerifyToken.belongsTo(User, { foreignKey: { name: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });

module.exports = ResetPasswordVerifyToken;