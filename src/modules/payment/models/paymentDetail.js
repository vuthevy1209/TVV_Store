const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const Order = require('../../order/models/order');
const PaymentType = require('./paymentType');

const PaymentDetail = sequelize.define('PaymentDetail', {


    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'id'
        }
    },
    amount: { // the real amount paid by the customer
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PaymentType,
            key: 'id'
        }
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    tableName: 'payment_details',
    timestamps: true,
    createdAt: 'created_at',
    modifiedAt: 'modified_at'
    
});

PaymentDetail.belongsTo(Order, {foreignKey: 'order_id'}, {onDelete: 'CASCADE', onUpdate: 'CASCADE'});
PaymentDetail.belongsTo(PaymentType, {foreignKey: 'payment_type_id'}, {onDelete: 'CASCADE', onUpdate: 'CASCADE'});

module.exports = PaymentDetail;