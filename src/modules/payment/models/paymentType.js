const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const PaymentType = sequelize.define('payment_types',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    desc: {
        type: DataTypes.TEXT
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    tableName: 'payment_types',
    timestamps: true,
    createdAt: 'created_at',
    modifiedAt: 'modified_at'
}
);

module.exports = PaymentType;

// // Seed data for PaymentType
// (async () => {
//     await PaymentType.findOrCreate({where: {name: 'nvpay'}, defaults: {desc: 'Payment through NVPay'}})
//     await PaymentType.findOrCreate({where: {name: 'cash'}, defaults: {desc: 'Cash payment'}})
// })();