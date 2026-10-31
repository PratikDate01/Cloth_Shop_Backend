const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

router.get('/active', getActiveCoupons);

// Admin endpoints
router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
