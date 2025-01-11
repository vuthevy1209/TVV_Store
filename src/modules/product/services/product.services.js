// src/modules/product/services/productService.js
const ProductCategory = require('../models/productCategory');
const ProductBrand = require('../models/productBrand');
const Product = require('../models/product');
const {Op} = require("sequelize");
const productReviewService = require('./productReview.services');
const index = require('../../../config/flexSearch');

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

    // // Search products based on multiple criteria with pagination
    // async search({
    //                  nameOrDescription,
    //                  brand,
    //                  category,
    //                  priceMin,
    //                  priceMax,
    //                  inventoryQuantityMin,
    //                  inventoryQuantityMax,
    //                  page = 1,
    //                  limit = 3,
    //                  sort
    //              }) {
    //     const query = {};
    //
    //     // Convert string type of numeric fields to numeric values
    //     if (priceMin) priceMin = parseFloat(priceMin);
    //     if (priceMax) priceMax = parseFloat(priceMax);
    //     if (inventoryQuantityMin) inventoryQuantityMin = parseInt(inventoryQuantityMin, 10);
    //     if (inventoryQuantityMax) inventoryQuantityMax = parseInt(inventoryQuantityMax, 10);
    //     if (page) page = parseInt(page, 10);
    //     if (limit) limit = parseInt(limit, 10);
    //
    //     if (nameOrDescription) {
    //         query[Op.or] = [
    //             {name: {[Op.iLike]: `%${nameOrDescription}%`}},  // Case-insensitive search for name
    //             {desc: {[Op.iLike]: `%${nameOrDescription}%`}} // Case-insensitive search for description
    //         ];
    //     }
    //     if (brand) query.brand_id = brand;
    //     if (category) query.category_id = category;
    //     if (priceMin) query.price = {[Op.gte]: priceMin};
    //     if (priceMax) query.price = {...query.price, [Op.lte]: priceMax};
    //     if (inventoryQuantityMin) query.inventory_quantity = {[Op.gte]: inventoryQuantityMin};
    //     if (inventoryQuantityMax) query.inventory_quantity = {
    //         ...query.inventory_quantity,
    //         [Op.lte]: inventoryQuantityMax
    //     };
    //
    //     const offset = (page - 1) * limit;
    //
    //     // Determine the sorting order
    //     let order = [];
    //     if (sort === 'priceAsc') {
    //         order.push(['price', 'ASC']);
    //     } else if (sort === 'priceDesc') {
    //         order.push(['price', 'DESC']);
    //     }
    //
    //     const {rows: products, count: totalProducts} = await Product.findAndCountAll({
    //         where: query,
    //         include: [
    //             {model: ProductCategory, attributes: ['name']},
    //             {model: ProductBrand, attributes: ['name']}
    //         ],
    //         offset,
    //         limit,
    //         order
    //     });
    //
    //     const productList = products.map(product => product.get({plain: true}));
    //     const brands = await ProductBrand.findAll();
    //     const productBrandList = brands.map(brand => brand.get({plain: true}));
    //     const categories = await ProductCategory.findAll();
    //     const productCategoryList = categories.map(category => category.get({plain: true}));
    //
    //     const totalPages = Math.ceil(totalProducts / limit);
    //
    //     const pagination = {
    //         currentPage: page,
    //         totalPages,
    //         hasPrev: page > 1,
    //         hasNext: page < totalPages,
    //         prevPage: page - 1,
    //         nextPage: page + 1,
    //         pages: Array.from({length: totalPages}, (_, i) => ({
    //             number: i + 1,
    //             active: i + 1 === page
    //         }))
    //     };
    //
    //     return {productList, productBrandList, productCategoryList, pagination};
    // }


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
        if (page) page = parseInt(page, 10);
        if (limit) limit = parseInt(limit, 10);

        let productIds = [];
        if (nameOrDescription) {
            // Use FlexSearch to search for products by name or description
            const flexSearchResults = index.search(nameOrDescription);
            productIds = flexSearchResults.map(result => result.result).flat();
            query.id = {[Op.in]: productIds};
        }

        if (brand) query.brand_id = brand;
        if (category) query.category_id = category;
        if (priceMin) query.price = {[Op.gte]: priceMin};
        if (priceMax) query.price = {...query.price, [Op.lte]: priceMax};
        if (inventoryQuantityMin) query.inventory_quantity = {[Op.gte]: inventoryQuantityMin};
        if (inventoryQuantityMax) query.inventory_quantity = {
            ...query.inventory_quantity,
            [Op.lte]: inventoryQuantityMax
        };

        const offset = (page - 1) * limit;

        // Determine the sorting order
        let order = [];
        if (sort === 'priceAsc') {
            order.push(['price', 'ASC']);
        } else if (sort === 'priceDesc') {
            order.push(['price', 'DESC']);
        }

        const {rows: products, count: totalProducts} = await Product.findAndCountAll({
            where: query,
            include: [
                {model: ProductCategory, attributes: ['name']},
                {model: ProductBrand, attributes: ['name']}
            ],
            offset,
            limit,
            order
        });

        const productList = products.map(product => product.get({plain: true}));
        const brands = await ProductBrand.findAll();
        const productBrandList = brands.map(brand => brand.get({plain: true}));
        const categories = await ProductCategory.findAll();
        const productCategoryList = categories.map(category => category.get({plain: true}));

        const totalPages = Math.ceil(totalProducts / limit);

        const pagination = {
            currentPage: page,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            pages: Array.from({length: totalPages}, (_, i) => ({
                number: i + 1,
                active: i + 1 === page
            }))
        };

        return {productList, productBrandList, productCategoryList, pagination};
    }

    async getProductDetails(productId, page = 1, limit = 5) {
        try {
            const product = await this.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }
            const productRelated = await this.getRelatedProducts(product.id, product.brand_id);
            const relatedProductList = productRelated.map(product => product.get({plain: true}));
            const productObject = product.get({plain: true});
            const {
                reviews,
                pagination
            } = await productReviewService.getProductReviews(productId, parseInt(page), parseInt(limit));

            return {productObject, relatedProductList, reviews, pagination};
        } catch (error) {
            console.error('Error getting product details:', error);
            throw new Error(error.message)
        }
    }

    // Get all brands
    async getAllBrands() {
        return await ProductBrand.findAll();
    }

    // Get all categories
    async getAllCategories() {
        return await ProductCategory.findAll();
    }


    async updateProductInventory(id, quantity) {
        const product = await Product.findByPk(id);
        if(quantity===0){
            throw new Error('Can not update inventory with 0 quantity');
        }
        if (product.inventory_quantity < quantity) {
            throw new Error('Product' + product.name + ' is out of stock' + ' (available: ' + product.inventory_quantity + ')');
        }
        product.inventory_quantity -= quantity;

        await product.save();
    }
    

    async indexProducts() {
        try {
            const products = await Product.findAll();

            // Map the products to match the indexed fields
            const documents = products.map(product => {
                const productData = product.get({plain: true});

                return {
                    id: productData.id, // Ensure the `id` field matches the one in the FlexSearch config
                    name: productData.name,
                    desc: productData.desc, // Include only fields that are indexed
                };
            });

            documents.forEach(doc => {
                index.add({
                    id: doc.id,
                    name: doc.name,
                    desc: doc.desc,
                });
            });
        } catch (error) {
            console.error('Error indexing products:', error);
            throw new Error(error.message);
        }
    }

}

module.exports = new ProductService();
