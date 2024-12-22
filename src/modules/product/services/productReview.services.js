// src/modules/product/services/productReview.services.js
const ProductReview = require('../models/productReview');
const Product = require('../models/product');
const User = require('../../user/models/user');

class ProductReviewService {
    /**
     * Get product reviews with pagination
     * @param {number} productId - ID of the product
     * @param {number} page - Page number
     * @param {number} limit - Number of reviews per page
     * @returns {Promise<Object>} - Paginated reviews
     */
    async getProductReviews(productId, page = 1, limit = 5) {
        const offset = (page - 1) * limit;
        const {count, rows} = await ProductReview.findAndCountAll({
            where: {product_id: productId, is_deleted: false},
            include: [
                {model: Product, attributes: ['name']},
                {model: User, attributes: ['first_name', 'last_name']}
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        const reviews = rows.map(review => {
            const plainReview = review.get({plain: true});
            plainReview.created_at = new Date(plainReview.created_at).toDateString();
            return plainReview;
        });

        const totalPages = Math.ceil(count / limit);

        const pagination = {
            total: count,
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

        return {
            reviews,
            pagination
        };
    }


    async addProductReview(userId, reviewData) {
        try {
            if (reviewData.comment === null || reviewData.comment.trim() === '') {
                throw new Error('Comment can not be empty');
            }
            const newReview = await ProductReview.create({
                product_id: parseInt(reviewData.product_id),
                user_id: userId,
                comment: reviewData.comment,
                // created_at: new Date(),
                // is_deleted: false
            });

            return newReview;
        }
        catch(error) {
            console.error('Error adding review:', error);
            throw new Error(error.message);
        }

    }
}

module.exports = new ProductReviewService();