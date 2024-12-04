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
    total: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    // payment_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //      model: PaymentDetail,
    //       key: 'id'
    // },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    updatedAt: 'updated_at'
});

Order.belongsTo(Customer, {foreignKey:{name: 'customer_id', onUpdate: 'CASCADE', onDelete: 'CASCADE'}});
//Order.belongsTo(Payment, {foreignKey: 'payment_id'});

module.exports = Order;