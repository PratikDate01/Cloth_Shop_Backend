const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const StoreSettings = require('../models/StoreSettings');
const { categoriesData, bannersData, couponsData } = require('./seedData');

const sampleProducts = [
  {
    name: 'Oversized Heavyweight Linen Shirt',
    sku: 'SHIRT-LINEN-01',
    categorySlug: 'shirts',
    subcategory: 'Linen Shirts',
    brand: 'AURA ATELIER',
    shortDescription: 'Tailored from 100% Normandy flax linen with relaxed drop shoulders and mother-of-pearl buttons.',
    fullDescription: 'Our signature linen shirt is crafted from pre-washed pure European flax. Engineered with a relaxed silhouette, French seams, and a gently structured Cuban collar that drapes effortlessly whether tucked or worn loose.',
    originalPrice: 2899,
    sellingPrice: 1999,
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableColors: ['Bone White', 'Sage Green', 'Obsidian Black'],
    fabric: '100% Normandy Flax Linen (180 GSM)',
    careInstructions: 'Machine wash delicate at 30°C. Air dry flat in shade. Warm iron inside out.',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.9,
    ratingsCount: 38,
    totalSold: 142,
    images: [
      {
        public_id: 'prod_linen_shirt_1',
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_linen_shirt_2',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
      {
        public_id: 'prod_linen_shirt_3',
        url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Fit', value: 'Relaxed / Contemporary Oversized' },
      { key: 'Collar', value: 'Camp / Cuban Collar' },
      { key: 'Buttons', value: 'Sustainably Sourced Mother of Pearl' },
      { key: 'Origin', value: 'Handcrafted in Bengaluru' },
    ],
    variants: [
      { sku: 'SHIRT-LINEN-01-S-WHT', size: 'S', color: 'Bone White', colorCode: '#F8F6F0', stockQuantity: 25 },
      { sku: 'SHIRT-LINEN-01-M-WHT', size: 'M', color: 'Bone White', colorCode: '#F8F6F0', stockQuantity: 30 },
      { sku: 'SHIRT-LINEN-01-L-WHT', size: 'L', color: 'Bone White', colorCode: '#F8F6F0', stockQuantity: 40 },
      { sku: 'SHIRT-LINEN-01-XL-WHT', size: 'XL', color: 'Bone White', colorCode: '#F8F6F0', stockQuantity: 20 },
      { sku: 'SHIRT-LINEN-01-M-SGE', size: 'M', color: 'Sage Green', colorCode: '#9BAA88', stockQuantity: 18 },
      { sku: 'SHIRT-LINEN-01-L-SGE', size: 'L', color: 'Sage Green', colorCode: '#9BAA88', stockQuantity: 22 },
      { sku: 'SHIRT-LINEN-01-M-BLK', size: 'M', color: 'Obsidian Black', colorCode: '#111111', stockQuantity: 35 },
      { sku: 'SHIRT-LINEN-01-L-BLK', size: 'L', color: 'Obsidian Black', colorCode: '#111111', stockQuantity: 28 },
    ],
  },
  {
    name: '280 GSM Supima Heavyweight Boxy Tee',
    sku: 'TEE-SUPIMA-BOX-02',
    categorySlug: 't-shirts',
    subcategory: 'Boxy Fit',
    brand: 'AURA ATELIER',
    shortDescription: 'Ultra-dense 280 GSM long-staple Supima cotton with thick ribbed 1-inch collar.',
    fullDescription: 'Constructed from combed compact Supima cotton, this tee offers an architectural drape that retains its silhouette wash after wash. Features reinforced twin needle seams and anti-pilling compact weave.',
    originalPrice: 1699,
    sellingPrice: 1199,
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableColors: ['Chalk White', 'Washed Charcoal', 'Olive Ochre'],
    fabric: '100% American Supima Cotton (280 GSM)',
    careInstructions: 'Machine wash cold inside out. Do not tumble dry.',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.8,
    ratingsCount: 64,
    totalSold: 310,
    images: [
      {
        public_id: 'prod_tee_box_1',
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_tee_box_2',
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Weight', value: '280 GSM Heavyweight' },
      { key: 'Cut', value: 'Boxy Drop Shoulder' },
      { key: 'Collar', value: '1.25" High Density Ribbed' },
    ],
    variants: [
      { sku: 'TEE-SUPIMA-02-S-WHT', size: 'S', color: 'Chalk White', colorCode: '#FFFFFF', stockQuantity: 40 },
      { sku: 'TEE-SUPIMA-02-M-WHT', size: 'M', color: 'Chalk White', colorCode: '#FFFFFF', stockQuantity: 50 },
      { sku: 'TEE-SUPIMA-02-L-WHT', size: 'L', color: 'Chalk White', colorCode: '#FFFFFF', stockQuantity: 45 },
      { sku: 'TEE-SUPIMA-02-XL-WHT', size: 'XL', color: 'Chalk White', colorCode: '#FFFFFF', stockQuantity: 30 },
      { sku: 'TEE-SUPIMA-02-M-CHR', size: 'M', color: 'Washed Charcoal', colorCode: '#333333', stockQuantity: 35 },
      { sku: 'TEE-SUPIMA-02-L-CHR', size: 'L', color: 'Washed Charcoal', colorCode: '#333333', stockQuantity: 28 },
    ],
  },
  {
    name: 'Japanese Selvedge Wide-Leg Denim',
    sku: 'JEANS-SELVEDGE-03',
    categorySlug: 'jeans-denim',
    subcategory: 'Wide Leg',
    brand: 'AURA ATELIER',
    shortDescription: '13.5 oz red-line selvedge denim woven on vintage shuttle looms in Okayama.',
    fullDescription: 'Custom 13.5 oz raw selvedge denim featuring a relaxed high-rise waist and a subtly tapered wide leg. Finished with custom matte black metal hardware and a vegetable-tanned leather waistband patch.',
    originalPrice: 4499,
    sellingPrice: 3299,
    availableSizes: ['30', '32', '34', '36', '38'],
    availableColors: ['Raw Indigo', 'Washed Black'],
    fabric: '100% Okayama Selvedge Cotton (13.5 oz)',
    careInstructions: 'Dry clean recommended for first year, or cold hand wash inside out.',
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.9,
    ratingsCount: 22,
    totalSold: 88,
    images: [
      {
        public_id: 'prod_jeans_selv_1',
        url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_jeans_selv_2',
        url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Weave', value: 'Right Hand Twill Red-Line Selvedge' },
      { key: 'Rise', value: 'High Rise' },
      { key: 'Fly', value: 'Solid Brass Button Fly' },
    ],
    variants: [
      { sku: 'JEANS-03-30-IND', size: '30', color: 'Raw Indigo', colorCode: '#1A2A44', stockQuantity: 15 },
      { sku: 'JEANS-03-32-IND', size: '32', color: 'Raw Indigo', colorCode: '#1A2A44', stockQuantity: 24 },
      { sku: 'JEANS-03-34-IND', size: '34', color: 'Raw Indigo', colorCode: '#1A2A44', stockQuantity: 30 },
      { sku: 'JEANS-03-36-IND', size: '36', color: 'Raw Indigo', colorCode: '#1A2A44', stockQuantity: 12 },
      { sku: 'JEANS-03-32-BLK', size: '32', color: 'Washed Black', colorCode: '#222222', stockQuantity: 18 },
      { sku: 'JEANS-03-34-BLK', size: '34', color: 'Washed Black', colorCode: '#222222', stockQuantity: 20 },
    ],
  },
  {
    name: '450 GSM French Terry Pullover Hoodie',
    sku: 'HOODIE-TERRY-04',
    categorySlug: 'hoodies-sweatshirts',
    subcategory: 'Pullover Hoodies',
    brand: 'AURA ATELIER',
    shortDescription: 'Substantial 450 GSM combed loopback cotton with double-layered crossover hood.',
    fullDescription: 'Engineered without external drawstrings for an uninterrupted minimalist profile. Built with kangaroo pouch pocket, drop shoulders, and reinforced ribbed cuffs that maintain their resilience.',
    originalPrice: 3499,
    sellingPrice: 2499,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Heather Ash', 'Midnight Navy', 'Pitch Black'],
    fabric: '100% Heavy Combed Cotton French Terry (450 GSM)',
    careInstructions: 'Machine wash cold. Reshape whilst damp.',
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    isCombo: false,
    ratingsAverage: 4.9,
    ratingsCount: 51,
    totalSold: 215,
    images: [
      {
        public_id: 'prod_hoodie_1',
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_hoodie_2',
        url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Weight', value: '450 GSM Loopback Terry' },
      { key: 'Hood', value: 'Double Layered Crossover' },
      { key: 'Pockets', value: 'Seamless Kangaroo Front Pocket' },
    ],
    variants: [
      { sku: 'HOOD-04-S-ASH', size: 'S', color: 'Heather Ash', colorCode: '#D3D3D3', stockQuantity: 18 },
      { sku: 'HOOD-04-M-ASH', size: 'M', color: 'Heather Ash', colorCode: '#D3D3D3', stockQuantity: 30 },
      { sku: 'HOOD-04-L-ASH', size: 'L', color: 'Heather Ash', colorCode: '#D3D3D3', stockQuantity: 25 },
      { sku: 'HOOD-04-XL-ASH', size: 'XL', color: 'Heather Ash', colorCode: '#D3D3D3', stockQuantity: 15 },
      { sku: 'HOOD-04-M-BLK', size: 'M', color: 'Pitch Black', colorCode: '#050505', stockQuantity: 28 },
      { sku: 'HOOD-04-L-BLK', size: 'L', color: 'Pitch Black', colorCode: '#050505', stockQuantity: 32 },
    ],
  },
  {
    name: 'Architectural Utility Chore Jacket',
    sku: 'JACKET-CHORE-05',
    categorySlug: 'jackets-outerwear',
    subcategory: 'Utility Jackets',
    brand: 'AURA ATELIER',
    shortDescription: 'Heavy cotton drill chore coat with four functional gusseted patch pockets.',
    fullDescription: 'An elevated interpretation of historic workwear jackets. Crafted from unlined organic cotton canvas drill, featuring contrast corduroy collar accents, interior document pocket, and reinforced elbow patches.',
    originalPrice: 4999,
    sellingPrice: 3799,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Tobacco Tan', 'Deep Forest', 'Washed Black'],
    fabric: '100% Organic Heavy Cotton Drill (380 GSM)',
    careInstructions: 'Spot clean or gentle cold wash.',
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.8,
    ratingsCount: 19,
    totalSold: 74,
    images: [
      {
        public_id: 'prod_jacket_1',
        url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_jacket_2',
        url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Material', value: '380 GSM Cotton Canvas Drill' },
      { key: 'Collar', value: 'Fine Wale Corduroy Contrast' },
      { key: 'Pockets', value: '4 Exterior + 1 Internal Chest Pocket' },
    ],
    variants: [
      { sku: 'JKT-05-S-TAN', size: 'S', color: 'Tobacco Tan', colorCode: '#9E6D38', stockQuantity: 12 },
      { sku: 'JKT-05-M-TAN', size: 'M', color: 'Tobacco Tan', colorCode: '#9E6D38', stockQuantity: 20 },
      { sku: 'JKT-05-L-TAN', size: 'L', color: 'Tobacco Tan', colorCode: '#9E6D38', stockQuantity: 18 },
      { sku: 'JKT-05-M-GRN', size: 'M', color: 'Deep Forest', colorCode: '#2B3D2E', stockQuantity: 15 },
      { sku: 'JKT-05-L-GRN', size: 'L', color: 'Deep Forest', colorCode: '#2B3D2E', stockQuantity: 14 },
    ],
  },
  {
    name: 'Pleated Relaxed Italian Wool Trousers',
    sku: 'TROUSER-PLEAT-06',
    categorySlug: 'trousers-chinos',
    subcategory: 'Pleated Trousers',
    brand: 'AURA ATELIER',
    shortDescription: 'Double forward pleats with side adjusters and a fluid, drape-forward drape.',
    fullDescription: 'Crafted from a breathable tropical wool blend woven in Biella, Italy. Designed with a generous mid-rise, discreet elasticated back waistband segment for all-day comfort, and blind-hem cuffs.',
    originalPrice: 3899,
    sellingPrice: 2899,
    availableSizes: ['30', '32', '34', '36'],
    availableColors: ['Charcoal Grey', 'Warm Khaki', 'Black'],
    fabric: '65% Fine Wool, 30% Viscose, 5% Elastane',
    careInstructions: 'Dry clean only.',
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.7,
    ratingsCount: 29,
    totalSold: 112,
    images: [
      {
        public_id: 'prod_trouser_1',
        url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_trouser_2',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Waistband', value: 'Side Buckle Adjusters' },
      { key: 'Pleats', value: 'Double Forward Deep Pleats' },
      { key: 'Pockets', value: 'Slanted Front Pockets + Jetted Back' },
    ],
    variants: [
      { sku: 'TRS-06-30-CHR', size: '30', color: 'Charcoal Grey', colorCode: '#4A4A4A', stockQuantity: 16 },
      { sku: 'TRS-06-32-CHR', size: '32', color: 'Charcoal Grey', colorCode: '#4A4A4A', stockQuantity: 24 },
      { sku: 'TRS-06-34-CHR', size: '34', color: 'Charcoal Grey', colorCode: '#4A4A4A', stockQuantity: 22 },
      { sku: 'TRS-06-32-KHK', size: '32', color: 'Warm Khaki', colorCode: '#B8A47E', stockQuantity: 18 },
      { sku: 'TRS-06-34-KHK', size: '34', color: 'Warm Khaki', colorCode: '#B8A47E', stockQuantity: 20 },
    ],
  },
  {
    name: 'The Modern Gentleman 2-Piece Linen & Trouser Bundle',
    sku: 'COMBO-MODERN-07',
    categorySlug: 'combo-sets',
    subcategory: 'Shirt & Trouser Duos',
    brand: 'AURA ATELIER',
    shortDescription: 'Pair our signature Normandy Linen Shirt with Pleated Italian Trousers at 25% bundle savings.',
    fullDescription: 'Our most popular curated ensemble. Effortless styling for resort evenings, creative offices, or destination celebrations. Includes 1x Linen Shirt and 1x Pleated Trousers with coordinated shade pairings.',
    originalPrice: 6798,
    sellingPrice: 4499,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Bone White & Charcoal', 'Sage & Khaki'],
    fabric: 'Normandy Flax Linen + Tropical Wool Blend',
    careInstructions: 'Refer to individual care instructions for garments.',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isCombo: true,
    ratingsAverage: 5.0,
    ratingsCount: 14,
    totalSold: 65,
    images: [
      {
        public_id: 'prod_combo_1',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
      {
        public_id: 'prod_combo_2',
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
        isPrimary: false,
      },
    ],
    specifications: [
      { key: 'Bundle Items', value: '1x Linen Shirt + 1x Pleated Trouser' },
      { key: 'Savings', value: '25% Bundle Discount Included' },
      { key: 'Packaging', value: 'Presented in Gift Presentation Box' },
    ],
    variants: [
      { sku: 'CMB-07-S-WHTCHR', size: 'S', color: 'Bone White & Charcoal', colorCode: '#E5E5E5', stockQuantity: 10 },
      { sku: 'CMB-07-M-WHTCHR', size: 'M', color: 'Bone White & Charcoal', colorCode: '#E5E5E5', stockQuantity: 20 },
      { sku: 'CMB-07-L-WHTCHR', size: 'L', color: 'Bone White & Charcoal', colorCode: '#E5E5E5', stockQuantity: 22 },
      { sku: 'CMB-07-M-SGEKHK', size: 'M', color: 'Sage & Khaki', colorCode: '#9BAA88', stockQuantity: 15 },
      { sku: 'CMB-07-L-SGEKHK', size: 'L', color: 'Sage & Khaki', colorCode: '#9BAA88', stockQuantity: 18 },
    ],
  },
  {
    name: 'Raw Edge Minimalist Oversized Crewneck',
    sku: 'TEE-RAW-EDGE-08',
    categorySlug: 't-shirts',
    subcategory: 'Oversized Tees',
    brand: 'AURA ATELIER',
    shortDescription: 'Pre-shrunk 240 GSM single jersey cotton with subtle raw-stitched hem accents.',
    fullDescription: 'Understated elegance in every detail. Features blind seam finishes, slightly elongated sleeve proportions, and a silicon-washed texture that feels broken-in from the first wear.',
    originalPrice: 1599,
    sellingPrice: 1099,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Raw Sand', 'Dark Clay', 'Off-Black'],
    fabric: '100% Combed Organic Cotton (240 GSM)',
    careInstructions: 'Machine wash cold.',
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    isCombo: false,
    ratingsAverage: 4.6,
    ratingsCount: 31,
    totalSold: 92,
    images: [
      {
        public_id: 'prod_tee_raw_1',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
        isPrimary: true,
      },
    ],
    specifications: [
      { key: 'Fit', value: 'Modern Drop Shoulder' },
      { key: 'Weight', value: '240 GSM Midweight' },
    ],
    variants: [
      { sku: 'TEE-08-S-SND', size: 'S', color: 'Raw Sand', colorCode: '#D9C8B4', stockQuantity: 25 },
      { sku: 'TEE-08-M-SND', size: 'M', color: 'Raw Sand', colorCode: '#D9C8B4', stockQuantity: 30 },
      { sku: 'TEE-08-L-SND', size: 'L', color: 'Raw Sand', colorCode: '#D9C8B4', stockQuantity: 28 },
      { sku: 'TEE-08-M-CLY', size: 'M', color: 'Dark Clay', colorCode: '#734638', stockQuantity: 18 },
      { sku: 'TEE-08-L-CLY', size: 'L', color: 'Dark Clay', colorCode: '#734638', stockQuantity: 22 },
    ],
  },
];

const autoSeedInitialData = async () => {
  try {
    // 1. Seed Store Settings
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        storeName: 'AURA ATELIER',
        storeTagline: 'Contemporary Luxury & Everyday Essentials',
        announcementText: '✨ FREE EXPRESS SHIPPING OVER ₹999 | EXTRA 5% OFF ON PREPAID ORDERS',
        announcementActive: true,
        currency: 'INR',
        currencySymbol: '₹',
        shippingCharges: 99,
        freeShippingThreshold: 999,
        prepaidDiscountPercent: 5,
        codEnabled: true,
        codFee: 49,
        minOrderValue: 299,
        returnWindowDays: 7,
      });
      console.log('🌱 Seeded Store Settings');
    }

    // 2. Seed Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@clothshop.com').toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Aura Store Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@ClothShop2026',
        phone: '+91 98765 00000',
        role: 'admin',
        isActive: true,
        isVerified: true,
      });
      console.log(`🌱 Seeded Admin User: ${adminEmail}`);
    }

    // 3. Seed Demo Customer User
    const customerEmail = 'customer@clothshop.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'Pratik Demo Customer',
        email: customerEmail,
        password: 'Customer@ClothShop2026',
        phone: '+91 98765 11111',
        role: 'customer',
        isActive: true,
        isVerified: true,
      });
      console.log(`🌱 Seeded Demo Customer User: ${customerEmail}`);
    }

    // 4. Seed Categories
    const categoryMap = {};
    for (const catData of categoriesData) {
      let cat = await Category.findOne({ slug: catData.slug });
      if (!cat) {
        cat = await Category.create(catData);
      }
      categoryMap[catData.slug] = cat._id;
    }

    // 5. Seed Products if count is low
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('🌱 Seeding initial fashion product catalogue...');
      for (const prod of sampleProducts) {
        const catId = categoryMap[prod.categorySlug];
        if (catId) {
          const baseSlug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          await Product.create({
            ...prod,
            category: catId,
            slug: baseSlug,
          });
        }
      }
      console.log(`🌱 Seeded ${sampleProducts.length} high-quality fashion products`);
    }

    // 6. Seed Banners
    const bannerCount = await Banner.countDocuments();
    if (bannerCount === 0) {
      for (const b of bannersData) {
        await Banner.create(b);
      }
      console.log('🌱 Seeded Promotional Banners');
    }

    // 7. Seed Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      for (const c of couponsData) {
        await Coupon.create(c);
      }
      console.log('🌱 Seeded Discount Coupons');
    }
  } catch (err) {
    console.error('Seed Runner Error:', err.message);
  }
};

module.exports = { autoSeedInitialData };

// If executed directly from CLI (e.g. `npm run seed`)
if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB()
    .then(async () => {
      await autoSeedInitialData();
      console.log('✅ Seeding complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding script failed:', err);
      process.exit(1);
    });
}
