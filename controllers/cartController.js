const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const StoreSettings = require('../models/StoreSettings');

// Helper to get or create cart based on user or guestId
const getOrCreateCart = async (userId, guestId) => {
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
  } else if (guestId) {
    cart = await Cart.findOne({ guestId: guestId });
    if (!cart) {
      cart = await Cart.create({ guestId: guestId, items: [] });
    }
  }
  return cart;
};

// Helper to get shipping settings
const getShippingSettings = async () => {
  const settings = await StoreSettings.findOne();
  return {
    threshold: settings?.freeShippingThreshold || 999,
    fee: settings?.shippingCharges || 99,
  };
};

/**
 * @desc    Get current user or guest cart
 * @route   GET /api/cart
 * @access  Public / Optional Auth
 */
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.query.guestId;

    if (!userId && !guestId) {
      return res.status(200).json({
        success: true,
        cart: { items: [], subtotal: 0, finalAmount: 0, shippingFee: 0, couponDiscount: 0 },
      });
    }

    let cart = await getOrCreateCart(userId, guestId);
    const { threshold, fee } = await getShippingSettings();

    // Revalidate cart items against live product pricing and stock
    let modified = false;
    const validatedItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product && product.isActive) {
        const variant = product.variants.find((v) => v.sku === item.variantSku);
        if (variant && variant.stockQuantity > 0) {
          const currentPrice = variant.price || product.sellingPrice;
          const currentOriginal = product.originalPrice;
          const currentImage = product.images[0]?.url || item.image;

          if (item.price !== currentPrice || item.quantity > variant.stockQuantity) {
            item.price = currentPrice;
            item.originalPrice = currentOriginal;
            item.quantity = Math.min(item.quantity, variant.stockQuantity);
            item.image = currentImage;
            modified = true;
          }
          validatedItems.push(item);
        } else {
          // Variant out of stock or removed
          modified = true;
        }
      } else {
        // Product no longer exists or inactive
        modified = true;
      }
    }

    cart.items = validatedItems;
    cart.calculateTotals(threshold, fee);
    if (modified) {
      await cart.save();
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Public / Optional Auth
 */
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.body.guestId;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authorization token or guest ID is required',
      });
    }

    const { productId, variantSku, quantity = 1 } = req.body;

    if (!productId || !variantSku) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and variant SKU are required',
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant || !variant.isAvailable || variant.stockQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected size/color variant is currently out of stock',
      });
    }

    const cart = await getOrCreateCart(userId, guestId);
    const existingItemIndex = cart.items.findIndex((item) => item.variantSku === variantSku);

    const price = variant.price || product.sellingPrice;
    const originalPrice = product.originalPrice;
    const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || '';

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));

    if (existingItemIndex > -1) {
      const newQty = cart.items[existingItemIndex].quantity + qtyToAdd;
      if (newQty > variant.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stockQuantity} items available in stock for this variant.`,
        });
      }
      cart.items[existingItemIndex].quantity = newQty;
      cart.items[existingItemIndex].price = price;
    } else {
      if (qtyToAdd > variant.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stockQuantity} items available in stock for this variant.`,
        });
      }
      cart.items.push({
        product: product._id,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: qtyToAdd,
        price,
        originalPrice,
        name: product.name,
        image: primaryImage,
      });
    }

    const { threshold, fee } = await getShippingSettings();
    cart.calculateTotals(threshold, fee);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to shopping bag',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update item quantity or variant in cart
 * @route   PUT /api/cart/items/:itemId
 * @access  Public / Optional Auth
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.query.guestId;
    const { itemId } = req.params;
    const { quantity, newVariantSku } = req.body;

    const cart = await getOrCreateCart(userId, guestId);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      cart.items.pull(itemId);
      await cart.save();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Changing variant (size/color)
    if (newVariantSku && newVariantSku !== item.variantSku) {
      const newVariant = product.variants.find((v) => v.sku === newVariantSku);
      if (!newVariant || newVariant.stockQuantity < (quantity || item.quantity)) {
        return res.status(400).json({
          success: false,
          message: 'The requested variant size/color does not have enough stock',
        });
      }
      item.variantSku = newVariant.sku;
      item.size = newVariant.size;
      item.color = newVariant.color;
      item.price = newVariant.price || product.sellingPrice;
    }

    // Changing quantity
    if (quantity !== undefined) {
      const qtyNum = parseInt(quantity, 10);
      if (qtyNum <= 0) {
        cart.items.pull(itemId);
      } else {
        const variant = product.variants.find((v) => v.sku === item.variantSku);
        if (qtyNum > (variant?.stockQuantity || 0)) {
          return res.status(400).json({
            success: false,
            message: `Only ${variant?.stockQuantity || 0} items available in stock`,
          });
        }
        item.quantity = qtyNum;
      }
    }

    const { threshold, fee } = await getShippingSettings();
    cart.calculateTotals(threshold, fee);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Public / Optional Auth
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.query.guestId;
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId, guestId);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items.pull(itemId);
    const { threshold, fee } = await getShippingSettings();
    cart.calculateTotals(threshold, fee);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from bag',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Apply coupon code
 * @route   POST /api/cart/coupon
 * @access  Public / Optional Auth
 */
exports.applyCoupon = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.body.guestId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const cart = await getOrCreateCart(userId, guestId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const subtotal = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const validation = coupon.isValidForOrder(subtotal, userId);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    cart.coupon = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };

    const { threshold, fee } = await getShippingSettings();
    cart.calculateTotals(threshold, fee);
    await cart.save();

    res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove coupon
 * @route   DELETE /api/cart/coupon
 * @access  Public / Optional Auth
 */
exports.removeCoupon = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['x-guest-id'] || req.query.guestId;

    const cart = await getOrCreateCart(userId, guestId);
    if (cart) {
      cart.coupon = { code: null, discountType: null, discountValue: 0 };
      cart.couponDiscount = 0;
      const { threshold, fee } = await getShippingSettings();
      cart.calculateTotals(threshold, fee);
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Coupon removed',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Merge guest cart into user cart upon login
 * @route   POST /api/cart/merge
 * @access  Private
 */
exports.mergeGuestCart = async (req, res, next) => {
  try {
    const { guestId } = req.body;
    if (!guestId) {
      return res.status(400).json({ success: false, message: 'Guest ID is required to merge' });
    }

    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0) {
      const userCart = await getOrCreateCart(req.user._id, null);
      return res.status(200).json({ success: true, cart: userCart });
    }

    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Merge items avoiding duplicate variant additions
    for (const gItem of guestCart.items) {
      const existingIdx = userCart.items.findIndex((item) => item.variantSku === gItem.variantSku);
      if (existingIdx > -1) {
        userCart.items[existingIdx].quantity += gItem.quantity;
      } else {
        userCart.items.push(gItem);
      }
    }

    const { threshold, fee } = await getShippingSettings();
    userCart.calculateTotals(threshold, fee);
    await userCart.save();

    // Clean up temporary guest cart
    await Cart.findByIdAndDelete(guestCart._id);

    res.status(200).json({
      success: true,
      message: 'Cart synchronized with your account',
      cart: userCart,
    });
  } catch (err) {
    next(err);
  }
};
