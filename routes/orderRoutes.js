const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrderPublic,
  cancelOrder,
  requestReturn,
} = require('../controllers/orderController');
const { optionalAuth, protect } = require('../middleware/auth');

// Public tracking
router.post('/track', trackOrderPublic);

// Create order (guest or authenticated)
router.post('/', optionalAuth, createOrder);

// Authenticated user order actions
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/return', protect, requestReturn);

module.exports = router;
