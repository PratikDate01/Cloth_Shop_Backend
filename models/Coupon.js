const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: {
      type: Number,
      default: 1000,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to validate coupon against an order amount and user
couponSchema.methods.isValidForOrder = function (subtotal, userId = null) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, message: 'Coupon offer has not started yet' };
  if (now > this.expiryDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon limit reached' };
  if (subtotal < this.minOrderValue) return { valid: false, message: `Minimum cart value of ₹${this.minOrderValue} required for this coupon` };

  if (userId && this.perCustomerLimit) {
    const userUses = this.usedBy.filter(u => u.user && u.user.toString() === userId.toString()).length;
    if (userUses >= this.perCustomerLimit) {
      return { valid: false, message: 'You have already used this coupon maximum allowed times' };
    }
  }

  return { valid: true };
};

module.exports = mongoose.model('Coupon', couponSchema);
