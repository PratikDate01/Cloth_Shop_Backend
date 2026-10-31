const Banner = require('../models/Banner');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

/**
 * @desc    Get active banners for storefront
 * @route   GET /api/banners
 * @access  Public
 */
exports.getBanners = async (req, res, next) => {
  try {
    const { position } = req.query;
    const query = { isActive: true };
    if (position) query.position = position;

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all banners (Admin)
 * @route   GET /api/banners/admin
 * @access  Private/Admin
 */
exports.getAllBannersAdmin = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, banners });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create banner (Admin - device uploaded image required)
 * @route   POST /api/banners
 * @access  Private/Admin
 */
exports.createBanner = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      badgeText,
      image,
      ctaText,
      ctaLink,
      secondaryCtaText,
      secondaryCtaLink,
      position,
      displayOrder,
      isActive,
    } = req.body;

    if (!title || !image || !image.public_id || !image.url) {
      return res.status(400).json({
        success: false,
        message: 'Title and banner image uploaded from device are required',
      });
    }

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      badgeText: badgeText || 'NEW COLLECTION 2026',
      image,
      ctaText: ctaText || 'SHOP COLLECTION',
      ctaLink: ctaLink || '/shop',
      secondaryCtaText: secondaryCtaText || '',
      secondaryCtaLink: secondaryCtaLink || '',
      position: position || 'hero',
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update banner (Admin)
 * @route   PUT /api/banners/:id
 * @access  Private/Admin
 */
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (req.body.image && req.body.image.public_id && req.body.image.public_id !== banner.image.public_id) {
      deleteFromCloudinary(banner.image.public_id).catch(() => {});
    }

    const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      banner: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete banner (Admin)
 * @route   DELETE /api/banners/:id
 * @access  Private/Admin
 */
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (banner.image?.public_id) {
      deleteFromCloudinary(banner.image.public_id).catch(() => {});
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
