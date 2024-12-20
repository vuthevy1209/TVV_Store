const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Customer = require('../../customer/models/customer');
//const PaymentDetail = require('../../payment/models/paymentDetail');

const Order = sequelize.define('Order', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Customer,
            key: 'id'
        }
    },
    total_price: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    status: {
        type: DataTypes.TINYINT, // 0: pending, 1: processing, 2: completed
        allowNull: false,
        defaultValue: 0 
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }

}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    modifiedAt: 'modified_at',
});

Order.belongsTo(Customer, {foreignKey:{name: 'customer_id', onUpdate: 'CASCADE', onDelete: 'CASCADE'}});

module.exports = Order;