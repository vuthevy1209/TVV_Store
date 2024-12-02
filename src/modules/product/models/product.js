// src/modules/product/models/product.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const ProductCategory = require('./productCategory');
const ProductBrand = require('./productBrand');

const Product = sequelize.define('Product', {
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
    category_id: {
        type: DataTypes.INTEGER,
        references: {
            model: ProductCategory,
            key: 'id'
        },
        allowNull: false
    },
    brand_id: {
        type: DataTypes.INTEGER,
        references: {
            model: ProductBrand,
            key: 'id'
        },
        allowNull: false
    },
    inventory_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    image_urls: {
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    business_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'products',
    timestamps: true
});

/// Define associations with ON DELETE and ON UPDATE cascade
Product.belongsTo(ProductCategory, { foreignKey: { name: 'category_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });
Product.belongsTo(ProductBrand, { foreignKey: { name: 'brand_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });
module.exports = Product;