const assert = require('assert');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const { autoSeedInitialData } = require('../seeds/seedRunner');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

async function runTests() {
  console.log('🧪 Starting Cloth Shop Backend Integration Test Suite...\n');

  try {
    // Test 1: Connect DB & Seed
    console.log('Test 1: Connecting to Database and Running Auto-Seed...');
    await connectDB();
    await autoSeedInitialData();
    console.log('✅ Test 1 Passed: Database connected and seeded successfully.\n');

    // Test 2: Verify Admin User
    console.log('Test 2: Verifying Admin Account...');
    const admin = await User.findOne({ role: 'admin' });
    assert(admin, 'Admin account should exist');
    assert.strictEqual(admin.email, 'admin@clothshop.com');
    console.log(`✅ Test 2 Passed: Found Admin (${admin.email}).\n`);

    // Test 3: Verify Categories
    console.log('Test 3: Verifying Categories...');
    const categories = await Category.find();
    assert(categories.length >= 7, 'Should have at least 7 categories');
    console.log(`✅ Test 3 Passed: Found ${categories.length} categories.\n`);

    // Test 4: Verify Products & Variants
    console.log('Test 4: Verifying Products & Variants...');
    const products = await Product.find().populate('category');
    assert(products.length >= 8, 'Should have at least 8 seeded products');
    const firstProduct = products[0];
    assert(firstProduct.variants.length > 0, 'Product must have variant models');
    assert(firstProduct.variants[0].sku, 'Variant must possess a SKU');
    assert(firstProduct.variants[0].stockQuantity >= 0, 'Variant stock cannot be negative');
    console.log(`✅ Test 4 Passed: Found ${products.length} products. Sample: "${firstProduct.name}" (${firstProduct.variants.length} variants).\n`);

    // Test 5: Verify Cart Calculation Logic
    console.log('Test 5: Testing Cart Model and Totals Calculation...');
    const testCart = new Cart({
      items: [
        {
          product: firstProduct._id,
          variantSku: firstProduct.variants[0].sku,
          size: firstProduct.variants[0].size,
          color: firstProduct.variants[0].color,
          quantity: 2,
          price: 1000,
          originalPrice: 1500,
          name: firstProduct.name,
          image: firstProduct.images[0].url,
        },
      ],
      coupon: { code: 'TEST10', discountType: 'percentage', discountValue: 10 },
    });
    testCart.calculateTotals(999, 99);
    assert.strictEqual(testCart.subtotal, 2000, 'Subtotal should be 2000');
    assert.strictEqual(testCart.couponDiscount, 200, '10% of 2000 should be 200 discount');
    assert.strictEqual(testCart.shippingFee, 0, 'Free shipping over 999 threshold');
    assert.strictEqual(testCart.finalAmount, 1800, 'Final payable should be 1800');
    console.log('✅ Test 5 Passed: Cart totals and coupon discounts calculated correctly.\n');

    console.log('======================================================');
    console.log('🎉 ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
