const productService = require('../services/product.services');
const ProductReviewService = require("../services/productReview.services");

class ProductController {
    // [GET] /products
    async index(req, res, next) {
        try {
            const {page = 1, limit = 3 } = req.query;
            const { productList, productBrandList, productCategoryList, pagination } = await productService.search({
               page: page, limit: limit
            });

            if (req.headers.accept.includes('application/json')) { // fetch by AJAX
                return res.json({ productList, pagination });
            }

            res.render('product/products', { // for the first time --> need to render all components
                productList,
                productBrandList,
                productCategoryList,
                pagination
            });
        } catch (error) {
            console.error('Error searching products:', error);
            //res.status(500).json({ error: 'Internal Server Error' });
            next(error);
        }
    }

    // [GET] /products/search
    async search(req, res, next) {
        try {
            const { nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax, page = 1, limit = 3, sort } = req.query;
            const { productList, productBrandList, productCategoryList, pagination } = await productService.search({
                nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax, page, limit, sort
            });

            if (req.headers.accept.includes('application/json')) { // fetch by AJAX
                return res.json({ productList, pagination });
            }

            res.render('product/products', { // for the first time --> need to render all components
                productList,
                productBrandList,
                productCategoryList,
                pagination,
                query: { nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax, sort }
            });
        } catch (error) {
            console.error('Error searching products:', error);
            next(error);
        }
    }


    // [GET] /products/:id
    async getProductDetails(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 5 } = req.query;
            const result = await productService.getProductDetails(id, parseInt(page), parseInt(limit));
            const productObject = result.productObject;
            const relatedProductList = result.relatedProductList;
            const reviews = await result.reviews;
            const pagination = result.pagination;

            if (req.headers.accept.includes('application/json')) { // fetch by AJAX
                return res.status(200).json({reviews, pagination});
            }

            return res.render('product/product-details', {  productObject, relatedProductList, reviews, pagination });
        } catch (error) {
            console.error('Error finding product:', error);
            next(error);
        }
    }
}

module.exports = new ProductController();
