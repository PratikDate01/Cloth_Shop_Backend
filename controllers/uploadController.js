const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
} = require('../services/cloudinaryService');

/**
 * @desc    Upload single image from device (Category, Banner, Logo, Favicon)
 * @route   POST /api/uploads/single
 * @access  Private/Admin
 */
exports.uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file selected. Please choose an image file from your device.',
      });
    }

    const folder = req.body.folder || 'cloth_shop/general';
    const uploadedAsset = await uploadToCloudinary(req.file.path, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully from device',
      image: uploadedAsset,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload multiple product images from device
 * @route   POST /api/uploads/product-images
 * @access  Private/Admin
 */
exports.uploadProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select one or more image files from your device.',
      });
    }

    const uploadedAssets = await uploadMultipleToCloudinary(
      req.files,
      'cloth_shop/products'
    );

    // Format with isPrimary indicator (first is primary by default)
    const formattedImages = uploadedAssets.map((asset, index) => ({
      public_id: asset.public_id,
      url: asset.url,
      isPrimary: index === 0,
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedAssets.length} image(s) uploaded successfully`,
      images: formattedImages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete image asset by public_id
 * @route   DELETE /api/uploads/:publicId
 * @access  Private/Admin
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required' });
    }

    await deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
