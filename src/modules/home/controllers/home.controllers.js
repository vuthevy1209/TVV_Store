const productService = require("../../product/services/product.services");


class HomeControllers {
    // [GET] /home
    async index(req, res) {
        try {
            const products = await productService.getSomeProducts(8);
            // Convert each product to a plain object
            const productList = products.map(product => product.get({ plain: true }));

            res.render('home', { productList });

        } catch (error) {
            console.error('Error getting product list:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [GET] /contact
    contact(req, res) {
        res.render('contact');
    }
}

module.exports = new HomeControllers();