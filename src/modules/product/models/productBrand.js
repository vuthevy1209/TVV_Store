// src/modules/product/models/productBrand.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const Product = require('./product');

const ProductBrand = sequelize.define('ProductBrand', {
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
    tableName: 'product_brands',
    timestamps: true
});

// Define the association
// ProductBrand.hasMany(Product, { foreignKey: 'brand_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = ProductBrand;