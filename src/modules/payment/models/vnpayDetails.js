const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const PaymentDetails = require('./paymentDetails');

/**
 * 
 * {"vnp_Amount":"5005000","vnp_BankCode":"NCB","vnp_BankTranNo":"VNP14765030","vnp_CardType":"ATM","vnp_OrderInfo":"Pay+for+order+3a0387f4929423561a56580713e9aa5b%3Adac3b18648ba41670a5c2e7306e997af","vnp_PayDate":"20241223151744","vnp_ResponseCode":"00","vnp_TmnCode":"YNA5OJA0","vnp_TransactionNo":"14765030","vnp_TransactionStatus":"00","vnp_TxnRef":"3a0387f4929423561a56580713e9aa5b%3Adac3b18648ba41670a5c2e7306e997af"}
 */

const VNPayDetails = sequelize.define('vnpay-details', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    payment_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vnp_TransactionNo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    tableName: 'vnpay_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

VNPayDetails.belongsTo(PaymentDetails, {foreignKey: 'payment_detail_id'}, {onDelete: 'CASCADE', onUpdate: 'CASCADE'});

module.exports = VNPayDetails;