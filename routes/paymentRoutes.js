const express = require('express');
const router = express.Router();
const {
  verifyPayment,
  handleWebhook,
  refundOrder,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Razorpay client verification callback
router.post('/razorpay/verify', verifyPayment);

// Razorpay server-to-server webhook
router.post('/razorpay/webhook', handleWebhook);

// Admin refund
router.post('/:orderId/refund', protect, authorize('admin'), refundOrder);

module.exports = router;
