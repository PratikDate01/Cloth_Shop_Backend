const StoreSettings = require('../models/StoreSettings');

/**
 * @desc    Get store configuration and public settings
 * @route   GET /api/settings
 * @access  Public
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update store settings (Admin)
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};
