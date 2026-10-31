const Product = require('../models/Product');
const Category = require('../models/Category');
const { adjustVariantStock } = require('../services/inventoryService');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      subcategory,
      minPrice,
      maxPrice,
      size,
      color,
      brand,
      inStock,
      tag,
      search,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    // Search query
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } },
        { shortDescription: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() });
        if (cat) query.category = cat._id;
      }
    }

    // Subcategory filter
    if (subcategory) {
      query.subcategory = { $regex: `^${subcategory}$`, $options: 'i' };
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: `^${brand}$`, $options: 'i' };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // Size filter
    if (size) {
      const sizes = Array.isArray(size) ? size : [size];
      query.availableSizes = { $in: sizes };
    }

    // Color filter
    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      query.availableColors = { $in: colors };
    }

    // Tag filter (New, Best Seller, Trending, Combo)
    if (tag) {
      if (tag === 'new') query.isFeatured = true;
      if (tag === 'bestseller') query.isBestSeller = true;
      if (tag === 'trending') query.isTrending = true;
      if (tag === 'combo') query.isCombo = true;
    }

    // Stock availability
    if (inStock === 'true') {
      query['variants.stockQuantity'] = { $gt: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { sellingPrice: 1 };
    if (sort === 'price-desc') sortOption = { sellingPrice: -1 };
    if (sort === 'popular') sortOption = { ratingsAverage: -1, ratingsCount: -1 };
    if (sort === 'bestseller') sortOption = { totalSold: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single product by slug or ID
 * @route   GET /api/products/:identifier
 * @access  Public
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let product;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: identifier }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: currentProduct.category,
      _id: { $ne: currentProduct._id },
      isActive: true,
    })
      .limit(4)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      products: related,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a product (Admin only - images must be pre-uploaded from device)
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      shortDescription,
      fullDescription,
      category,
      subcategory,
      brand,
      originalPrice,
      sellingPrice,
      images,
      variants,
      availableSizes,
      availableColors,
      fabric,
      careInstructions,
      specifications,
      isFeatured,
      isBestSeller,
      isTrending,
      isCombo,
    } = req.body;

    if (!name || !sku || !category || !originalPrice || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, SKU, category, originalPrice and sellingPrice',
      });
    }

    // STRICT REQUIREMENT CHECK: images must exist from device upload
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image uploaded from your device is required.',
      });
    }

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    // Build variants and derive sizes/colors if not explicitly passed
    const parsedVariants = variants && variants.length > 0 ? variants : [];
    const sizes = availableSizes || [...new Set(parsedVariants.map((v) => v.size))];
    const colors = availableColors || [...new Set(parsedVariants.map((v) => v.color))];

    const product = await Product.create({
      name,
      slug,
      sku: sku.toUpperCase().trim(),
      shortDescription,
      fullDescription,
      category,
      subcategory: subcategory || '',
      brand: brand || 'AURA ATELIER',
      originalPrice: Number(originalPrice),
      sellingPrice: Number(sellingPrice),
      images,
      variants: parsedVariants,
      availableSizes: sizes,
      availableColors: colors,
      fabric: fabric || '100% Premium Cotton',
      careInstructions,
      specifications: specifications || [],
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isTrending: Boolean(isTrending),
      isCombo: Boolean(isCombo),
    });

    // Record initial inventory transaction for each variant
    for (const v of parsedVariants) {
      if (v.stockQuantity > 0) {
        await adjustVariantStock({
          productId: product._id,
          variantSku: v.sku,
          changeQuantity: v.stockQuantity,
          type: 'IN',
          referenceType: 'INITIAL_STOCK',
          reason: 'Initial Product Stock Setup',
          performedBy: req.user ? req.user.name : 'Admin',
        }).catch((err) => console.warn('Init inventory record warning:', err.message));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a product (Admin)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if new images removed old ones to clean up Cloudinary assets
    if (req.body.images && Array.isArray(req.body.images)) {
      const newPublicIds = new Set(req.body.images.map((img) => img.public_id));
      for (const oldImg of product.images) {
        if (!newPublicIds.has(oldImg.public_id)) {
          deleteFromCloudinary(oldImg.public_id).catch((err) =>
            console.warn('Image cleanup err:', err.message)
          );
        }
      }
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a product (Admin)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Clean up uploaded images
    for (const img of product.images) {
      deleteFromCloudinary(img.public_id).catch((err) =>
        console.warn('Delete image warning:', err.message)
      );
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Adjust variant stock (Admin)
 * @route   POST /api/products/:id/adjust-stock
 * @access  Private/Admin
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const { variantSku, quantity, type, reason } = req.body;

    if (!variantSku || quantity === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide variantSku, quantity, and type (IN, OUT, ADJUSTMENT)',
      });
    }

    const result = await adjustVariantStock({
      productId: req.params.id,
      variantSku,
      changeQuantity: Number(quantity),
      type,
      referenceType: 'MANUAL_ADJUSTMENT',
      reason: reason || 'Manual Admin Inventory Adjustment',
      performedBy: req.user ? req.user.name : 'Admin',
    });

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
