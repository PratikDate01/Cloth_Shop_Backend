const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    variantSku: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: 'System',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    items: [orderItemSnapshotSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      alternatePhone: String,
      houseNumber: { type: String, required: true },
      street: { type: String, required: true },
      area: String,
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      addressType: { type: String, default: 'Home' },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      couponDiscount: { type: Number, default: 0 },
      couponCode: { type: String, default: null },
      prepaidDiscount: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      finalAmount: { type: Number, required: true },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ['razorpay', 'cod'],
        required: true,
      },
      status: {
        type: String,
        enum: [
          'PENDING',
          'PROCESSING',
          'PAID',
          'FAILED',
          'CANCELLED',
          'REFUND_PENDING',
          'REFUNDED',
          'PARTIALLY_REFUNDED',
        ],
        default: 'PENDING',
        index: true,
      },
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      paidAt: { type: Date, default: null },
      refundAmount: { type: Number, default: 0 },
    },
    orderStatus: {
      type: String,
      enum: [
        'Order Placed',
        'Payment Confirmed',
        'Processing',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Return Requested',
        'Return Approved',
        'Returned',
        'Refund Initiated',
        'Refunded',
      ],
      default: 'Order Placed',
      index: true,
    },
    tracking: {
      courierName: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      trackingUrl: { type: String, default: '' },
      estimatedDelivery: { type: Date, default: null },
      statusHistory: [statusHistorySchema],
    },
    cancellation: {
      reason: { type: String, default: '' },
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: String, default: '' },
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to add status history
orderSchema.methods.addStatusHistory = function (status, note = '', updatedBy = 'System') {
  this.orderStatus = status;
  this.tracking.statusHistory.push({
    status,
    note,
    timestamp: new Date(),
    updatedBy,
  });
};

module.exports = mongoose.model('Order', orderSchema);
