const {DataTypes} = require('@sequelize/core');
const {Sequelize} = require('../../../config/database');

const Customer = require('../../customer/models/customer');


const Cart = Sequelize.define('Cart', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    customer_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:Customer,
            key:'id'
        }
    },
    is_open:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:true
    }
},{
    tableName:'carts'

});

Cart.belongsTo(Customer, { foreignKey: 'customer_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});

//Cart.hasMany(CartItem, { foreignKey: 'cart_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});

module.exports = Cart;
