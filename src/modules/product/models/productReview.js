// src/modules/product/models/productReview.js
const { DataTypes } = require('@sequelize/core');
const { sequelize } = require('../../../config/database');
const Product = require('./product');
const User = require('../../user/models/user');

const ProductReview = sequelize.define('ProductReview', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'product_reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at'
});

/// Define associations with ON DELETE and ON UPDATE cascade
ProductReview.belongsTo(Product, { foreignKey: { name: 'product_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });
ProductReview.belongsTo(User, { foreignKey: { name: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' } });

module.exports = ProductReview;