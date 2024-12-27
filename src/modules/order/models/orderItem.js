const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Order = require('./order');
const Product = require('../../product/models/product');


const OrderItem = sequelize.define('OrderItem', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Order,
            key: 'id'
        },
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'id'
        },
        allowNull: false
    },
    product_price: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

OrderItem.belongsTo(Order, {foreignKey:{name: 'order_id', onUpdate: 'CASCADE', onDelete: 'CASCADE'}});
OrderItem.belongsTo(Product, {foreignKey:{name: 'product_id', onUpdate: 'CASCADE', onDelete: 'CASCADE'}});


module.exports = OrderItem;