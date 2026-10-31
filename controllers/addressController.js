const Address = require('../models/Address');

/**
 * @desc    Get user's saved addresses
 * @route   GET /api/addresses
 * @access  Private
 */
exports.getMyAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: addresses.length, addresses });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add new address
 * @route   POST /api/addresses
 * @access  Private
 */
exports.addAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      alternatePhone,
      houseNumber,
      street,
      area,
      landmark,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    } = req.body;

    if (!fullName || !phone || !houseNumber || !street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone, house number, street, city, state, and postal code',
      });
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    } else {
      const count = await Address.countDocuments({ user: req.user._id });
      if (count === 0) {
        req.body.isDefault = true;
      }
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      alternatePhone: alternatePhone || '',
      houseNumber,
      street,
      area: area || '',
      landmark: landmark || '',
      city,
      state,
      postalCode,
      country: country || 'India',
      addressType: addressType || 'Home',
      isDefault: Boolean(req.body.isDefault),
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
exports.updateAddress = async (req, res, next) => {
  try {
    let address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
