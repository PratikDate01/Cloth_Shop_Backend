const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    colorCode: {
      type: String,
      default: '#000000',
    },
    price: {
      type: Number,
      default: null, // if null, uses product.sellingPrice
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productImageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide primary SKU'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    fullDescription: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please specify category'],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: 'AURA ATELIER',
    },
    originalPrice: {
      type: Number,
      required: [true, 'Please specify original price'],
      min: [0, 'Price must be positive'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please specify selling price'],
      min: [0, 'Price must be positive'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: {
      type: [productImageSchema],
      validate: [
        (val) => val.length > 0,
        'At least one product image is required',
      ],
    },
    variants: [variantSchema],
    availableSizes: [
      {
        type: String,
        trim: true,
      },
    ],
    availableColors: [
      {
        type: String,
        trim: true,
      },
    ],
    fabric: {
      type: String,
      trim: true,
      default: '100% Premium Cotton',
    },
    careInstructions: {
      type: String,
      trim: true,
      default: 'Machine wash cold with like colors. Tumble dry low.',
    },
    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    returnEligible: {
      type: Boolean,
      default: true,
    },
    returnWindowDays: {
      type: Number,
      default: 7,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCombo: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate discount percentage before save
productSchema.pre('save', function (next) {
  if (this.originalPrice > 0 && this.sellingPrice > 0) {
    if (this.originalPrice > this.sellingPrice) {
      this.discountPercent = Math.round(
        ((this.originalPrice - this.sellingPrice) / this.originalPrice) * 100
      );
    } else {
      this.discountPercent = 0;
    }
  }
  next();
});

// Virtual for total stock across all variants
productSchema.virtual('totalStock').get(function () {
  if (!this.variants || this.variants.length === 0) return 0;
  return this.variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
});

// Index for text search on name, shortDescription, brand, sku
productSchema.index({
  name: 'text',
  shortDescription: 'text',
  brand: 'text',
  sku: 'text',
});

module.exports = mongoose.model('Product', productSchema);
