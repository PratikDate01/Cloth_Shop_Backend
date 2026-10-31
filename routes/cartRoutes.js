const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  mergeGuestCart,
} = require('../controllers/cartController');
const { optionalAuth, protect } = require('../middleware/auth');

router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addToCart);
router.put('/items/:itemId', optionalAuth, updateCartItem);
router.delete('/items/:itemId', optionalAuth, removeFromCart);
router.post('/coupon', optionalAuth, applyCoupon);
router.delete('/coupon', optionalAuth, removeCoupon);
router.post('/merge', protect, mergeGuestCart);

module.exports = router;
