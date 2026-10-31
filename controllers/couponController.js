const Coupon = require('../models/Coupon');

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get active coupons for customers
 * @route   GET /api/coupons/active
 * @access  Public
 */
exports.getActiveCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: now },
    }).select('code description discountType discountValue minOrderValue maxDiscount expiryDate');

    res.status(200).json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create coupon (Admin)
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide coupon code, discountType, discountValue, and expiryDate',
      });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: startDate || new Date(),
      expiryDate,
      usageLimit: Number(usageLimit) || 1000,
      perCustomerLimit: Number(perCustomerLimit) || 1,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update coupon (Admin)
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
exports.updateCoupon = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase().trim();
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete coupon (Admin)
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
