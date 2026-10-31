const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    badgeText: {
      type: String,
      trim: true,
      default: 'NEW COLLECTION 2026',
    },
    image: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    mobileImage: {
      public_id: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    ctaText: {
      type: String,
      default: 'EXPLORE COLLECTION',
    },
    ctaLink: {
      type: String,
      default: '/shop',
    },
    secondaryCtaText: {
      type: String,
      default: 'VIEW LOOKBOOK',
    },
    secondaryCtaLink: {
      type: String,
      default: '/shop?tag=new',
    },
    position: {
      type: String,
      enum: ['hero', 'promotional', 'category_feature', 'bottom_banner'],
      default: 'hero',
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Banner', bannerSchema);
