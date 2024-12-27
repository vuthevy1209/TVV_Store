const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Order = require('../../order/models/order');

const ShippingDetails = sequelize.define('ShippingDetails', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'id'
        }
    },
    fullname:{
        type: DataTypes.STRING,
        allowNull: false
    },
    address:{
        type: DataTypes.STRING,
        allowNull: false
    },
    district:{
        type: DataTypes.STRING,
        allowNull: false
    },
    province:{
        type: DataTypes.STRING,
        allowNull: false
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false
    },
    shipping_fee:{
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    is_deleted:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    tableName: 'shipping_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

ShippingDetails.belongsTo(Order, {foreignKey: 'order_id'}, {onDelete: 'CASCADE', onUpdate: 'CASCADE'});
module.exports = ShippingDetails;


