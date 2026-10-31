const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variantSku: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'ORDER', 'RETURN', 'CANCEL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    referenceType: {
      type: String,
      enum: ['ORDER', 'RETURN', 'MANUAL_ADJUSTMENT', 'INITIAL_STOCK'],
      default: 'MANUAL_ADJUSTMENT',
    },
    reason: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
