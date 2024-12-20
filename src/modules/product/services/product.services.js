// src/modules/product/services/productService.js
const ProductCategory = require('../models/productCategory');
const ProductBrand = require('../models/productBrand');
const Product = require('../models/product');
const {Op} = require("sequelize");

class ProductService {

    // Get all products
    async getAll() {
        return await Product.findAll({
            include: [
                {model: ProductCategory, attributes: ['name']},
                {model: ProductBrand, attributes: ['name']}
            ]
        });
    }

    // Find product by ID
    async findById(id) {
        return await Product.findOne({
            where: {id},
            include: [
                {model: ProductCategory, attributes: ['name']},
                {model: ProductBrand, attributes: ['name']}
            ]
        });
    }

    // Get 4 related products (excluding the current product)
    async getRelatedProducts(productId, brand) {
        return await Product.findAll({
            where: {
                id: {[Op.ne]: productId},  // Exclude the current product
                brand_id: brand
            },
            limit: 4,
            include: [
                {model: ProductCategory, attributes: ['name']},
                {model: ProductBrand, attributes: ['name']}
            ]
        });
    }

    // Search products based on multiple criteria with pagination
    async search({
                     nameOrDescription,
                     brand,
                     category,
                     priceMin,
                     priceMax,
                     inventoryQuantityMin,
                     inventoryQuantityMax,
                     page = 1,
                     limit = 3,
                     sort
                 }) {
        const query = {};

        // Convert string type of numeric fields to numeric values
        if (priceMin) priceMin = parseFloat(priceMin);
        if (priceMax) priceMax = parseFloat(priceMax);
        if (inventoryQuantityMin) inventoryQuantityMin = parseInt(inventoryQuantityMin, 10);
        if (inventoryQuantityMax) inventoryQuantityMax = parseInt(inventoryQuantityMax, 10);
        if(page) page = parseInt(page, 10);
        if(limit) limit = parseInt(limit, 10);

        if (nameOrDescription) {
            query[Op.or] = [
                { name: { [Op.iLike]: `%${nameOrDescription}%` } },  // Case-insensitive search for name
                { desc: { [Op.iLike]: `%${nameOrDescription}%` } } // Case-insensitive search for description
            ];
        }
        if (brand) query.brand_id = brand;
        if (category) query.category_id = category;
        if (priceMin) query.price = { [Op.gte]: priceMin };
        if (priceMax) query.price = { ...query.price, [Op.lte]: priceMax };
        if (inventoryQuantityMin) query.inventory_quantity = { [Op.gte]: inventoryQuantityMin };
        if (inventoryQuantityMax) query.inventory_quantity = { ...query.inventory_quantity, [Op.lte]: inventoryQuantityMax };

        const offset = (page - 1) * limit;

        // Determine the sorting order
        let order = [];
        if (sort === 'priceAsc') {
            order.push(['price', 'ASC']);
        } else if (sort === 'priceDesc') {
            order.push(['price', 'DESC']);
        }

        const { rows: products, count: totalProducts } = await Product.findAndCountAll({
            where: query,
            include: [
                { model: ProductCategory, attributes: ['name'] },
                { model: ProductBrand, attributes: ['name'] }
            ],
            offset,
            limit,
            order
        });

        const productList = products.map(product => product.get({ plain: true }));
        const brands = await ProductBrand.findAll();
        const productBrandList = brands.map(brand => brand.get({ plain: true }));
        const categories = await ProductCategory.findAll();
        const productCategoryList = categories.map(category => category.get({ plain: true }));

        const totalPages = Math.ceil(totalProducts / limit);

        const pagination = {
            currentPage: page,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            pages: Array.from({ length: totalPages }, (_, i) => ({
                number: i + 1,
                active: i + 1 === page
            }))
        };

        return { productList, productBrandList, productCategoryList, pagination };
    }

    // Get all brands
    async getAllBrands() {
        return await ProductBrand.findAll();
    }

    // Get all categories
    async getAllCategories() {
        return await ProductCategory.findAll();
    }
}

module.exports = new ProductService();
