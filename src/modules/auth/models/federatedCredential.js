const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const User = require('../../user/models/user');
const Role = require("../../user/models/role");

const FederatedCredential = sequelize.define('FederatedCredential', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Name of the users table
            key: 'id'
        }
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'federated_credentials',
    timestamps: false
});

// Define the association
FederatedCredential.belongsTo(User, { foreignKey: { name: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });

module.exports = FederatedCredential;