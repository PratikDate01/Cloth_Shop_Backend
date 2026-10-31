const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['RETURN', 'EXCHANGE'],
      default: 'RETURN',
    },
    items: [
      {
        variantSku: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        size: String,
        color: String,
        exchangeSizeRequested: String,
        price: Number,
      },
    ],
    reason: {
      type: String,
      required: true,
      enum: [
        'Size too small',
        'Size too large',
        'Defective/Damaged item',
        'Item not as pictured',
        'Wrong item sent',
        'Quality not as expected',
        'Other',
      ],
    },
    customerComments: {
      type: String,
      default: '',
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'PICKUP_SCHEDULED',
        'RECEIVED',
        'REFUNDED',
        'EXCHANGED',
      ],
      default: 'PENDING',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    pickupTracking: {
      courierName: String,
      trackingNumber: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
