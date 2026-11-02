const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Refund = require('../models/Refund');
const WebhookEvent = require('../models/WebhookEvent');
const {
  verifyPaymentSignature,
  verifyWebhookSignature,
  initiateRazorpayRefund,
} = require('../services/razorpayService');
const { deductOrderInventory } = require('../services/inventoryService');
const { sendOrderConfirmationEmail } = require('../services/emailService');

/**
 * @desc    Verify Razorpay payment after checkout callback
 * @route   POST /api/payments/razorpay/verify
 * @access  Public / Optional Auth
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment verification parameters',
      });
    }

    // 1. Locate the pending order in our database
    const order = await Order.findOne({
      $or: [
        { 'paymentInfo.razorpayOrderId': razorpay_order_id },
        { orderNumber: orderNumber },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order corresponding to this payment could not be found',
      });
    }

    // Check if order was already marked paid (idempotency guard)
    if (order.paymentInfo.status === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and confirmed',
        order,
      });
    }

    // 2. Perform rigorous server-side HMAC SHA-256 signature verification
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      // Record failed payment attempt
      await Payment.create({
        order: order._id,
        user: order.user,
        paymentMethod: 'razorpay',
        amount: order.pricing.finalAmount,
        currency: 'INR',
        status: 'FAILED',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        failureReason: 'HMAC signature verification failed. Invalid secret or tamper detected.',
      });

      order.paymentInfo.status = 'FAILED';
      order.addStatusHistory('Order Placed', 'Payment signature verification failed', 'Payment Gateway');
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid digital signature',
      });
    }

    // 3. Mark payment as verified & paid in Payment model
    await Payment.create({
      order: order._id,
      user: order.user,
      paymentMethod: 'razorpay',
      amount: order.pricing.finalAmount,
      currency: 'INR',
      status: 'PAID',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      rawResponse: req.body,
    });

    // 4. Update Order status
    order.paymentInfo.status = 'PAID';
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.paidAt = new Date();
    order.orderStatus = 'Payment Confirmed';
    order.addStatusHistory(
      'Payment Confirmed',
      `Payment verified via Razorpay ID: ${razorpay_payment_id}`,
      'Razorpay'
    );

    // 5. Deduct inventory safely now that payment is confirmed
    await deductOrderInventory(order);
    await order.save();

    // 6. Record coupon usage if coupon was applied
    if (order.pricing.couponCode) {
      const coupon = await Coupon.findOne({ code: order.pricing.couponCode });
      if (coupon) {
        coupon.usageCount += 1;
        if (order.user) {
          coupon.usedBy.push({ user: order.user, usedAt: new Date() });
        }
        await coupon.save();
      }
    }

    // 7. Clear user cart if authenticated, or guest cart
    if (order.user) {
      await Cart.findOneAndUpdate(
        { user: order.user },
        { items: [], coupon: null, couponDiscount: 0, subtotal: 0, finalAmount: 0 }
      );
    } else {
      const guestId = req.headers['x-guest-id'] || req.body.guestId;
      if (guestId) {
        await Cart.findOneAndUpdate(
          { guestId: guestId },
          { items: [], coupon: null, couponDiscount: 0, subtotal: 0, finalAmount: 0 }
        );
      }
    }

    // 8. Trigger order confirmation email
    sendOrderConfirmationEmail(order).catch((err) =>
      console.warn('Confirmation email warning:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      orderNumber: order.orderNumber,
      orderId: order._id,
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Razorpay Server-to-Server Webhook Endpoint
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (Signature protected)
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Verify webhook signature if webhook secret is configured
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('⚠️ Razorpay webhook signature verification failed.');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    const eventId = event.event_id || `${event.event}_${Date.now()}`;

    // Duplicate webhook protection
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      return res.status(200).json({ success: true, message: 'Webhook already processed' });
    }

    // Process specific event types
    switch (event.event) {
      case 'payment.captured': {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const order = await Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });

        if (order && order.paymentInfo.status !== 'PAID') {
          order.paymentInfo.status = 'PAID';
          order.paymentInfo.razorpayPaymentId = paymentEntity.id;
          order.paymentInfo.paidAt = new Date();
          order.orderStatus = 'Payment Confirmed';
          order.addStatusHistory(
            'Payment Confirmed',
            `Confirmed via Webhook (Payment ID: ${paymentEntity.id})`,
            'Razorpay Webhook'
          );
          await deductOrderInventory(order);
          await order.save();
          sendOrderConfirmationEmail(order).catch(() => {});
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const order = await Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });

        if (order && order.paymentInfo.status === 'PENDING') {
          order.paymentInfo.status = 'FAILED';
          order.addStatusHistory(
            'Order Placed',
            `Payment failed: ${paymentEntity.error_description || 'Card/UPI failure'}`,
            'Razorpay Webhook'
          );
          await order.save();
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = event.payload.refund.entity;
        const razorpayPaymentId = refundEntity.payment_id;
        const order = await Order.findOne({ 'paymentInfo.razorpayPaymentId': razorpayPaymentId });

        if (order) {
          order.paymentInfo.status = 'REFUNDED';
          order.addStatusHistory(
            'Refunded',
            `Refund processed via Razorpay Webhook: ₹${refundEntity.amount / 100}`,
            'Razorpay Webhook'
          );
          await order.save();
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Record webhook event as processed
    await WebhookEvent.create({
      eventId,
      eventType: event.event || 'unknown',
      payload: event,
      status: 'PROCESSED',
    });

    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Admin-initiated refund via Razorpay API
 * @route   POST /api/payments/:orderId/refund
 * @access  Private/Admin
 */
exports.refundOrder = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentInfo.status !== 'PAID' && order.paymentInfo.status !== 'REFUND_PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund order with payment status: ${order.paymentInfo.status}`,
      });
    }

    const refundAmount = Number(amount) || order.pricing.finalAmount;
    if (refundAmount <= 0 || refundAmount > order.pricing.finalAmount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount must be between ₹1 and ₹${order.pricing.finalAmount}`,
      });
    }

    // Call Razorpay refund service
    let razorpayRefund = null;
    if (order.paymentInfo.method === 'razorpay' && order.paymentInfo.razorpayPaymentId) {
      razorpayRefund = await initiateRazorpayRefund(
        order.paymentInfo.razorpayPaymentId,
        refundAmount,
        reason || 'Customer return / order cancellation refund'
      );
    }

    // Record in Refund collection
    const refundDoc = await Refund.create({
      order: order._id,
      amount: refundAmount,
      reason: reason || 'Customer Refund',
      status: 'PROCESSED',
      razorpayRefundId: razorpayRefund ? razorpayRefund.id : `rfnd_manual_${Date.now()}`,
      razorpayPaymentId: order.paymentInfo.razorpayPaymentId,
      mode: order.paymentInfo.method === 'razorpay' ? 'RAZORPAY' : 'MANUAL_BANK_TRANSFER',
      notes: reason || '',
    });

    order.paymentInfo.status = refundAmount === order.pricing.finalAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    order.paymentInfo.refundAmount = (order.paymentInfo.refundAmount || 0) + refundAmount;
    order.orderStatus = 'Refunded';
    order.addStatusHistory(
      'Refunded',
      `Refund of ₹${refundAmount} processed (${order.paymentInfo.method.toUpperCase()})`,
      req.user.name || 'Admin'
    );
    await order.save();

    res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully`,
      refund: refundDoc,
      order,
    });
  } catch (err) {
    next(err);
  }
};
