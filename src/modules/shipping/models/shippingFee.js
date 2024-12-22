const {DataTypes} = require('@sequelize/core');
const {sequelize} = require('../../../config/database');

const ShippingFee = sequelize.define('ShippingFee', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    province: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    cost: {
        type: DataTypes.DECIMAL,
        allowNull: false
    }
}, {
    tableName: 'shipping_fees',
    timestamps: false,
    createdAt: 'created_at',
    modifiedAt: 'modified_at'
});

module.exports = ShippingFee;

const shippingFees = [
    { province: 'Binh Dinh', cost: 50.00 },
    { province: 'Hanoi', cost: 30.00 },
    { province: 'Ho Chi Minh City', cost: 40.00 },
    // Add more provinces and their costs here
];

// async function populateShippingFees() {
//     try {
//         await sequelize.sync({ force: true }); // This will drop the table if it already exists
//         await ShippingFee.bulkCreate(shippingFees);
//         console.log('Shipping fees populated successfully');
//     } catch (error) {
//         console.error('Error populating shipping fees:', error);
//     } finally {
//         await sequelize.close();
//     }
// }

// populateShippingFees();