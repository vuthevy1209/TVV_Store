const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const PaymentDetails = require('./paymentDetails');

const VNPayDetails = sequelize.define('vnpay-details', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PaymentDetails,
            key: 'id'
        }
    },
    card_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    card_holder_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    card_expiry_month: {
        type: DataTypes.STRING,
        allowNull: false
    },
    card_expiry_year: {
        type: DataTypes.STRING,
        allowNull: false
    },
    card_cvv: {
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
    modifiedAt: 'modified_at'
});

VNPayDetails.belongsTo(PaymentDetails, {foreignKey: 'payment_detail_id'}, {onDelete: 'CASCADE', onUpdate: 'CASCADE'});

module.exports = VNPayDetails;