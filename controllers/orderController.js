const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const StoreSettings = require('../models/StoreSettings');
const ReturnRequest = require('../models/ReturnRequest');
const { deductOrderInventory, restoreOrderInventory } = require('../services/inventoryService');
const { createRazorpayOrder } = require('../services/razorpayService');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../services/emailService');

// Helper to generate unique order number: ORD-2026-XXXXX
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * @desc    Create a new order (Checkout)
 * @route   POST /api/orders
 * @access  Public / Optional Auth
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
      customerInfo,
      shippingAddress,
      items, // array of { productId, variantSku, quantity }
      paymentMethod, // 'razorpay' | 'cod'
      couponCode,
      notes,
    } = req.body;

    // Basic payload validations
    if (!customerInfo || !customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({ success: false, message: 'Customer full name, email, and phone are required' });
    }

    if (!shippingAddress || !shippingAddress.houseNumber || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    if (!['razorpay', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const settings = await StoreSettings.findOne();
    if (paymentMethod === 'cod' && settings && !settings.codEnabled) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery is currently disabled' });
    }

    // Backend-driven price, variant, and stock validation (NEVER TRUST CLIENT TOTALS)
    let subtotal = 0;
    const validatedSnapshots = [];

    for (const reqItem of items) {
      const product = await Product.findById(reqItem.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${reqItem.productId} is unavailable or inactive`,
        });
      }

      const variant = product.variants.find((v) => v.sku === reqItem.variantSku);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant SKU ${reqItem.variantSku} not found for product "${product.name}"`,
        });
      }

      const requestedQty = Math.max(1, parseInt(reqItem.quantity, 10));
      if (variant.stockQuantity < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (${variant.size} / ${variant.color}). Available: ${variant.stockQuantity}, Requested: ${requestedQty}`,
        });
      }

      const unitPrice = variant.price || product.sellingPrice;
      const itemSubtotal = unitPrice * requestedQty;
      subtotal += itemSubtotal;

      const primaryImg = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || '';

      validatedSnapshots.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        price: unitPrice,
        originalPrice: product.originalPrice,
        quantity: requestedQty,
        image: primaryImg,
        subtotal: itemSubtotal,
      });
    }

    // Validate Coupon
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (appliedCoupon) {
        const val = appliedCoupon.isValidForOrder(subtotal, req.user?._id);
        if (val.valid) {
          if (appliedCoupon.discountType === 'percentage') {
            couponDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
            if (appliedCoupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
            }
          } else if (appliedCoupon.discountType === 'fixed') {
            couponDiscount = Math.min(appliedCoupon.discountValue, subtotal);
          }
        }
      }
    }

    // Shipping fee
    const shippingThreshold = settings?.freeShippingThreshold || 999;
    const defaultShipping = settings?.shippingCharges || 99;
    let shippingFee = 0;

    if (appliedCoupon && appliedCoupon.discountType === 'free_shipping') {
      shippingFee = 0;
    } else if (subtotal >= shippingThreshold || subtotal === 0) {
      shippingFee = 0;
    } else {
      shippingFee = defaultShipping;
    }

    // Prepaid discount (e.g. 5% off if paid online)
    let prepaidDiscount = 0;
    if (paymentMethod === 'razorpay' && settings?.prepaidDiscountPercent > 0) {
      prepaidDiscount = Math.round((subtotal * settings.prepaidDiscountPercent) / 100);
    }

    // COD fee if applicable
    let codExtraFee = 0;
    if (paymentMethod === 'cod' && settings?.codFee > 0) {
      codExtraFee = settings.codFee;
    }

    const finalAmount = Math.max(
      0,
      subtotal - couponDiscount - prepaidDiscount + shippingFee + codExtraFee
    );

    const orderNumber = generateOrderNumber();

    // Create Order Record
    const order = new Order({
      orderNumber,
      user: req.user ? req.user._id : null,
      customerInfo: {
        fullName: customerInfo.fullName.trim(),
        email: customerInfo.email.toLowerCase().trim(),
        phone: customerInfo.phone.trim(),
      },
      items: validatedSnapshots,
      shippingAddress: {
        fullName: shippingAddress.fullName || customerInfo.fullName,
        phone: shippingAddress.phone || customerInfo.phone,
        alternatePhone: shippingAddress.alternatePhone || '',
        houseNumber: shippingAddress.houseNumber,
        street: shippingAddress.street,
        area: shippingAddress.area || '',
        landmark: shippingAddress.landmark || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
        addressType: shippingAddress.addressType || 'Home',
      },
      pricing: {
        subtotal,
        couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        prepaidDiscount,
        shippingFee: shippingFee + codExtraFee,
        tax: 0,
        finalAmount,
      },
      paymentInfo: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'PENDING' : 'PENDING',
      },
      orderStatus: 'Order Placed',
      tracking: {
        statusHistory: [
          {
            status: 'Order Placed',
            note: paymentMethod === 'cod' ? 'Cash on Delivery order placed' : 'Order initiated, awaiting online payment',
            timestamp: new Date(),
            updatedBy: 'Customer',
          },
        ],
      },
      adminNotes: notes || '',
    });

    // If COD: deduct inventory immediately and confirm order
    if (paymentMethod === 'cod') {
      await deductOrderInventory(order);
      await order.save();

      // Record coupon usage
      if (appliedCoupon) {
        appliedCoupon.usageCount += 1;
        if (req.user) {
          appliedCoupon.usedBy.push({ user: req.user._id, usedAt: new Date() });
        }
        await appliedCoupon.save();
      }

      // Clear cart
      if (req.user) {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null, couponDiscount: 0, subtotal: 0, finalAmount: 0 });
      }

      // Send email
      sendOrderConfirmationEmail(order).catch((err) => console.warn('Order email err:', err.message));

      return res.status(201).json({
        success: true,
        orderNumber: order.orderNumber,
        orderId: order._id,
        paymentMethod: 'cod',
        order,
      });
    }

    // If Razorpay: create Razorpay order
    const razorpayOrder = await createRazorpayOrder(finalAmount, order.orderNumber, {
      orderNumber: order.orderNumber,
      customerEmail: order.customerInfo.email,
    });

    order.paymentInfo.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order._id,
      paymentMethod: 'razorpay',
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency || 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      },
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verification: order must belong to user, or user is admin
    if (
      req.user.role !== 'admin' &&
      (!order.user || order.user.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Public order tracking (requires orderNumber + verified email or phone)
 * @route   POST /api/orders/track
 * @access  Public
 */
exports.trackOrderPublic = async (req, res, next) => {
  try {
    const { orderNumber, contact } = req.body;

    if (!orderNumber || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Order number and registered email or phone are required',
      });
    }

    const cleanOrderNumber = orderNumber.trim();
    const cleanContact = contact.toLowerCase().trim();

    const order = await Order.findOne({
      orderNumber: cleanOrderNumber,
      $or: [
        { 'customerInfo.email': cleanContact },
        { 'customerInfo.phone': cleanContact },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No matching order found with the provided details.',
      });
    }

    // Expose only safe public tracking timeline information
    const publicData = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentInfo.method.toUpperCase(),
      paymentStatus: order.paymentInfo.status,
      itemCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
      items: order.items.map((i) => ({
        name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        image: i.image,
      })),
      shippingCity: order.shippingAddress.city,
      shippingState: order.shippingAddress.state,
      tracking: {
        courierName: order.tracking.courierName,
        trackingNumber: order.tracking.trackingNumber,
        trackingUrl: order.tracking.trackingUrl,
        estimatedDelivery: order.tracking.estimatedDelivery,
        timeline: order.tracking.statusHistory,
      },
    };

    res.status(200).json({
      success: true,
      order: publicData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel order (Customer can cancel before shipped)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      req.user.role !== 'admin' &&
      (!order.user || order.user.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Cannot cancel if already shipped or delivered
    const nonCancellable = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
    if (nonCancellable.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at this stage (${order.orderStatus}). Please request a return after delivery.`,
      });
    }

    // Restore inventory if stock was deducted (i.e. if COD or if PAID)
    if (order.paymentInfo.status === 'PAID' || order.paymentInfo.method === 'cod') {
      await restoreOrderInventory(order, reason || 'Order Cancelled by Customer');
    }

    order.orderStatus = 'Cancelled';
    order.cancellation = {
      reason: reason || 'Customer requested cancellation',
      cancelledAt: new Date(),
      cancelledBy: req.user.role === 'admin' ? 'Admin' : 'Customer',
    };

    order.addStatusHistory(
      'Cancelled',
      reason || 'Order cancelled',
      req.user.role === 'admin' ? 'Admin' : 'Customer'
    );

    // If paid online, mark for refund
    if (order.paymentInfo.status === 'PAID') {
      order.paymentInfo.status = 'REFUND_PENDING';
    }

    await order.save();

    sendOrderStatusEmail(order, 'Cancelled').catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit return or exchange request
 * @route   POST /api/orders/:id/return
 * @access  Private
 */
exports.requestReturn = async (req, res, next) => {
  try {
    const { items, reason, customerComments, type = 'RETURN' } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Returns/Exchanges can only be requested for Delivered orders',
      });
    }

    // Check return window
    const settings = await StoreSettings.findOne();
    const returnWindowDays = settings?.returnWindowDays || 7;
    const daysSinceDelivery = Math.floor((Date.now() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({
        success: false,
        message: `Return window of ${returnWindowDays} days has expired.`,
      });
    }

    const returnRequest = await ReturnRequest.create({
      order: order._id,
      user: req.user._id,
      type: type.toUpperCase(),
      items,
      reason,
      customerComments: customerComments || '',
      status: 'PENDING',
    });

    order.addStatusHistory('Return Requested', `Return requested: ${reason}`, 'Customer');
    await order.save();

    res.status(201).json({
      success: true,
      message: `${type === 'EXCHANGE' ? 'Exchange' : 'Return'} request submitted successfully`,
      returnRequest,
    });
  } catch (err) {
    next(err);
  }
};
