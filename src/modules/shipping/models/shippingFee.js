const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const ShippingFee = sequelize.define('ShippingFee', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    province: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    cost: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'shipping_fees',
    timestamps: false,
    createdAt: 'created_at',
    modifiedAt: 'modified_at'
});

module.exports = ShippingFee;
