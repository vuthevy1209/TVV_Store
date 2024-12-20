const productService = require('../services/product.services');

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
    async show(req, res) {
        try {
            const product = await productService.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            const productRelated = await productService.getRelatedProducts(product.id, product.brand_id);
            // Convert related products to plain objects
            const relatedProductList = productRelated.map(product => product.get({ plain: true }));

            // Convert the main product to a plain object
            const productObject = product.get({ plain: true });

            res.render('product/product-details', { productObject, relatedProductList });
        } catch (error) {
            console.error('Error finding product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new ProductController();
