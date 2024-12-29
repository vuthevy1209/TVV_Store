const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Customer = require('../../customer/models/customer');

const moment = require('moment');

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
    amount_of_items: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    subtotal:{
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    status: {
        type: DataTypes.TINYINT, // 0: pending, 1: confirmed, 2: paid, 3: completed, 4: cancelled
        allowNull: false,
        defaultValue: 0 
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    expired_at: {
        type: DataTypes.DATE,
        defaultValue: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss')
    },

}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at'
});

Order.belongsTo(Customer, {foreignKey:{name: 'customer_id', onUpdate: 'CASCADE', onDelete: 'CASCADE'}});

module.exports = Order;