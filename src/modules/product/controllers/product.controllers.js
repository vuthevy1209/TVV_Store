const productService = require('../services/product.services');

class ProductController {
    // [GET] /products
    async index(req, res) {
        try {
            const products = await productService.getAll();
            // Convert each product to a plain object
            const productList = products.map(product => product.get({ plain: true }));
            const brands =  await productService.getAllBrands();
            const productBrandList = brands.map(brand => brand.get({ plain: true}));
            const categories =  await productService.getAllCategories();
            const productCategoryList = categories.map(category => category.get({ plain: true}));

            res.render('product/products', { productList, productBrandList, productCategoryList  });
        } catch (error) {
            console.error('Error getting product list:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [GET] /products/search
    async search(req, res) {
        try {
            const { nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax } = req.query;
            const products = await productService.search({ nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax });
            const productList = products.map(product => product.get({ plain: true }));
            const brands =  await productService.getAllBrands();
            const productBrandList = brands.map(brand => brand.get({ plain: true}));
            const categories =  await productService.getAllCategories();
            const productCategoryList = categories.map(category => category.get({ plain: true}));

            res.render('product/products', {
                productList,
                productBrandList,
                productCategoryList,
                query: { nameOrDescription, brand, category, priceMin, priceMax, inventoryQuantityMin, inventoryQuantityMax }
            });
        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).json({ error: 'Internal Server Error' });
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

    // // [GET] /products/create
    // create(req, res) {
    //     res.render('product/createProduct');
    // }

    // // [POST] /products
    // async store(req, res) {
    //     try {
    //         await productService.createProduct(req.body);
    //         res.redirect(`/home`);
    //     } catch (error) {
    //         console.error('Error creating product:', error);
    //         res.status(500).json({ error: 'Internal Server Error' });
    //     }
    // }
}

module.exports = new ProductController();
