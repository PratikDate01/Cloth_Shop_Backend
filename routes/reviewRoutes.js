const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);

// Admin endpoints
router.get('/admin', protect, authorize('admin'), getAllReviewsAdmin);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
