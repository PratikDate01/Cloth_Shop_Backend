const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    guestId: {
      type: String,
      index: true,
      default: null,
    },
    items: [cartItemSchema],
    coupon: {
      code: { type: String, default: null },
      discountType: { type: String, enum: ['percentage', 'fixed', 'free_shipping', null], default: null },
      discountValue: { type: Number, default: 0 },
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to recalculate cart summary
cartSchema.methods.calculateTotals = function (shippingThreshold = 999, defaultShipping = 99) {
  this.subtotal = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate coupon discount
  let discount = 0;
  if (this.coupon && this.coupon.code) {
    if (this.coupon.discountType === 'percentage') {
      discount = (this.subtotal * this.coupon.discountValue) / 100;
    } else if (this.coupon.discountType === 'fixed') {
      discount = Math.min(this.coupon.discountValue, this.subtotal);
    }
  }
  this.couponDiscount = Math.round(discount);

  // Shipping fee
  if (this.coupon && this.coupon.discountType === 'free_shipping') {
    this.shippingFee = 0;
  } else if (this.subtotal >= shippingThreshold || this.subtotal === 0) {
    this.shippingFee = 0;
  } else {
    this.shippingFee = defaultShipping;
  }

  this.finalAmount = Math.max(0, this.subtotal - this.couponDiscount + this.shippingFee);
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
