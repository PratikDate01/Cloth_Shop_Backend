const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'AURA ATELIER',
    },
    storeTagline: {
      type: String,
      default: 'Contemporary Luxury & Everyday Essentials',
    },
    logo: {
      public_id: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    favicon: {
      public_id: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    contactEmail: {
      type: String,
      default: 'support@auraatelier.com',
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    address: {
      type: String,
      default: '108 Fashion Avenue, Indiranagar, Bengaluru, KA 560038',
    },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      youtube: { type: String, default: 'https://youtube.com' },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    shippingCharges: {
      type: Number,
      default: 99,
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    prepaidDiscountPercent: {
      type: Number,
      default: 5, // 5% discount on prepaid online orders
    },
    codEnabled: {
      type: Boolean,
      default: true,
    },
    codFee: {
      type: Number,
      default: 49,
    },
    minOrderValue: {
      type: Number,
      default: 299,
    },
    returnWindowDays: {
      type: Number,
      default: 7,
    },
    announcementText: {
      type: String,
      default: '✨ FREE SHIPPING ON ORDERS ABOVE ₹999 | EXTRA 5% OFF ON PREPAID ORDERS',
    },
    announcementActive: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
