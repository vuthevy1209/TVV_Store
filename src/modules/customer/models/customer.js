const {DataTypes} = require("@sequelize/core");
const {Sequelize} = require("../../../config/database");

const User = require("../../user/models/user");
//const Cart = require("../../cart/models/cart");

const Customer = Sequelize.define('Customer', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    user_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:User,
            key:'id'
        }
    },
    is_deleted:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    }
}, {
    tableName:'customers',
    timestamps:true,
    createdAt:'created_at',
    updatedAt: 'modified_at'

});

Customer.belongsTo(User, { foreignKey: 'user_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});

//Customer.hasOne(Cart, { foreignKey: 'customer_id' },{onUpdate:'CASCADE', onDelete:'CASCADE'});

module.exports = Customer;