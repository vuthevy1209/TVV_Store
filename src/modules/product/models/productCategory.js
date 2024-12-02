const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const Product = require('./product');

const ProductCategory = sequelize.define('ProductCategory', {
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
    business_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'product_categories',
    timestamps: true
});

// Define the association
// ProductCategory.hasMany(Product, { foreignKey: 'category_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = ProductCategory;