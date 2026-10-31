const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * @desc    Get approved reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create review for product (detects verified purchase)
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, rating, and review comment',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this product',
      });
    }

    // Check if user actually purchased and received this product (Verified Purchase check)
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: 'Delivered',
      'items.productId': productId,
    });

    const isVerifiedPurchase = Boolean(deliveredOrder);

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      title: title || '',
      comment: comment.trim(),
      verifiedPurchase: isVerifiedPurchase,
      isApproved: true,
    });

    res.status(201).json({
      success: true,
      message: isVerifiedPurchase
        ? 'Verified buyer review posted successfully!'
        : 'Review posted successfully!',
      review,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all reviews (Admin moderation)
 * @route   GET /api/reviews/admin
 * @access  Private/Admin
 */
exports.getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name images sku')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Moderate review approval (Admin)
 * @route   PUT /api/reviews/:id/moderate
 * @access  Private/Admin
 */
exports.moderateReview = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Recalculate product rating
    await Review.calculateAverageRating(review.product);

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'hidden'} successfully`,
      review,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete review (Admin)
 * @route   DELETE /api/reviews/:id
 * @access  Private/Admin
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);
    await Review.calculateAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
