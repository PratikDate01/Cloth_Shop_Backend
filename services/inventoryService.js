const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * Adjust stock for a specific product variant and record transaction
 */
const adjustVariantStock = async ({
  productId,
  variantSku,
  changeQuantity, // positive for addition, negative for deduction
  type, // 'IN', 'OUT', 'ADJUSTMENT', 'ORDER', 'RETURN', 'CANCEL'
  referenceId = '',
  referenceType = 'MANUAL_ADJUSTMENT',
  reason = '',
  performedBy = 'System',
}) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) {
    throw new Error(`Variant not found for SKU: ${variantSku}`);
  }

  const previousStock = variant.stockQuantity || 0;
  const newStock = previousStock + changeQuantity;

  if (newStock < 0) {
    throw new Error(
      `Insufficient inventory for variant SKU ${variantSku}. Available: ${previousStock}, Requested deduction: ${Math.abs(changeQuantity)}`
    );
  }

  // Update variant stock and availability
  variant.stockQuantity = newStock;
  variant.isAvailable = newStock > 0;

  await product.save();

  // Create immutable stock movement audit record
  const transaction = await InventoryTransaction.create({
    product: productId,
    variantSku: variantSku,
    type: type,
    quantity: Math.abs(changeQuantity),
    previousStock: previousStock,
    newStock: newStock,
    referenceId: referenceId,
    referenceType: referenceType,
    reason: reason,
    performedBy: performedBy,
  });

  return { variant, transaction };
};

/**
 * Deduct stock for an entire confirmed order
 */
const deductOrderInventory = async (order) => {
  const deductions = [];

  for (const item of order.items) {
    const res = await adjustVariantStock({
      productId: item.productId,
      variantSku: item.variantSku,
      changeQuantity: -item.quantity,
      type: 'ORDER',
      referenceId: order.orderNumber,
      referenceType: 'ORDER',
      reason: `Order placed: #${order.orderNumber}`,
      performedBy: 'Order System',
    });
    deductions.push(res);
  }

  return deductions;
};

/**
 * Restore stock for cancelled order or returned items
 */
const restoreOrderInventory = async (order, reason = 'Order Cancelled') => {
  const restorations = [];

  for (const item of order.items) {
    const res = await adjustVariantStock({
      productId: item.productId,
      variantSku: item.variantSku,
      changeQuantity: item.quantity,
      type: 'CANCEL',
      referenceId: order.orderNumber,
      referenceType: 'ORDER',
      reason: reason,
      performedBy: 'Admin / Order Cancellation',
    });
    restorations.push(res);
  }

  return restorations;
};

module.exports = {
  adjustVariantStock,
  deductOrderInventory,
  restoreOrderInventory,
};
