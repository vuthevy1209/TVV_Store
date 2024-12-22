const ProductReviewService = require('../services/productReview.services');


class ProductReviewController {
     async getProductReviews(req, res) {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 5 } = req.query;
            const reviews = await ProductReviewService.getProductReviews(productId, parseInt(page), parseInt(limit));

            if (req.headers.accept.includes('application/json')) { // fetch by AJAX
                return res.status(200).json(reviews);
            }

            res.render('product/product-details', { // for the first time --> need to render all components
                reviews,
                pagination: reviews.pagination
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

     async addProductReview(req, res) {
        try {
            const reviewData = req.body;
            const userId = req.user.id;
            const newReview = await ProductReviewService.addProductReview(userId, reviewData);
            res.status(201).json({message: 'Review added successfully'});
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new ProductReviewController();