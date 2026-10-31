const crypto = require('crypto');
const { getRazorpayInstance, isRazorpayConfigured } = require('../config/razorpay');

/**
 * Create a new Razorpay Order
 * @param {number} amountInRupees - Order amount in INR (Rupees)
 * @param {string} receipt - Unique order or payment receipt id
 * @param {object} notes - Key-value metadata
 */
const createRazorpayOrder = async (amountInRupees, receipt, notes = {}) => {
  const razorpay = getRazorpayInstance();
  // Amount in paise (integer) to avoid float discrepancies
  const amountInPaise = Math.round(amountInRupees * 100);

  if (!isRazorpayConfigured()) {
    console.warn('⚠️ Razorpay credentials not configured or using test placeholder.');
    // In development mode when keys are not yet provided by user, generate a valid test order ID
    // so dev workflows and UI flows can proceed gracefully while documenting live setup
    return {
      id: `order_test_${Date.now()}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      status: 'created',
      isMock: true,
    };
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: String(receipt).slice(0, 40),
    payment_capture: 1, // Auto capture
    notes: notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error(error.error?.description || error.message || 'Razorpay order creation failed');
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (!isRazorpayConfigured()) {
    // If running in local test mode with mock order ID
    if (razorpayOrderId && razorpayOrderId.startsWith('order_test_')) {
      return true;
    }
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

/**
 * Verify Razorpay webhook signature
 * @param {string} rawBody - Raw unparsed webhook body as string
 * @param {string} signature - Header 'x-razorpay-signature'
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Initiate a refund through Razorpay API
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amountInRupees - Refund amount in rupees
 * @param {string} reason - Refund reason
 */
const initiateRazorpayRefund = async (paymentId, amountInRupees, reason = '') => {
  if (!isRazorpayConfigured() || (paymentId && paymentId.startsWith('pay_mock_'))) {
    return {
      id: `rfnd_mock_${Date.now()}`,
      payment_id: paymentId,
      amount: Math.round(amountInRupees * 100),
      status: 'processed',
      notes: { reason },
      isMock: true,
    };
  }

  const razorpay = getRazorpayInstance();
  const options = {
    amount: Math.round(amountInRupees * 100),
    notes: { reason },
  };

  try {
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw new Error(error.error?.description || error.message || 'Razorpay refund failed');
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  initiateRazorpayRefund,
  isRazorpayConfigured,
};
