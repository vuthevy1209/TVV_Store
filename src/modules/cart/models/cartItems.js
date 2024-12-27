const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Cart = require('./cart');
const Product = require('../../product/models/product')

const CartItem = sequelize.define('CartItem', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    cart_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references: {
            model: Cart,
            key: 'id'
        }
    },
    product_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references: {
            model: Product,
            key: 'id'
        }
    },
    quantity:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:1
    }
}, {
    tableName:'cart_items',
    timestamps: true,
    createdAt: 'created_at',
});

CartItem.belongsTo(Cart, { foreignKey: 'cart_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});
CartItem.belongsTo(Product, { foreignKey: 'product_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});

module.exports = CartItem;