// src/modules/product/models/productBrand.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');

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
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define the association
// ProductBrand.hasMany(Product, { foreignKey: 'brand_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = ProductBrand;