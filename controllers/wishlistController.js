const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug' },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle product in wishlist (Add/Remove)
 * @route   POST /api/wishlist/toggle
 * @access  Private
 */
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some((p) => p.toString() === productId.toString());
    let added = false;

    if (exists) {
      wishlist.products = wishlist.products.filter((p) => p.toString() !== productId.toString());
      added = false;
    } else {
      wishlist.products.push(productId);
      added = true;
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      added,
      message: added ? 'Added to Wishlist' : 'Removed from Wishlist',
      wishlistProductIds: wishlist.products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist,
    });
  } catch (err) {
    next(err);
  }
};
