/**
 * Realistic seed data for Aura Atelier luxury fashion brand
 */

const categoriesData = [
  {
    name: 'Shirts',
    slug: 'shirts',
    description: 'Crisp formal, semi-casual, and relaxed linen shirts tailored with bespoke precision.',
    subcategories: ['Linen Shirts', 'Oxford Shirts', 'Cuban Collar', 'Oversized Shirts'],
    displayOrder: 1,
    image: {
      public_id: 'seed_cat_shirts',
      url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Heavyweight Supima cotton tees with drop shoulders and contemporary minimalist fits.',
    subcategories: ['Oversized Tees', 'Boxy Fit', 'Crew Neck', 'Graphic Editions'],
    displayOrder: 2,
    image: {
      public_id: 'seed_cat_tshirts',
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'Jeans & Denim',
    slug: 'jeans-denim',
    description: 'Selvedge and relaxed raw Japanese and Italian stretch denim silhouettes.',
    subcategories: ['Straight Leg', 'Relaxed Fit', 'Wide Leg', 'Slim Tapered'],
    displayOrder: 3,
    image: {
      public_id: 'seed_cat_jeans',
      url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'Hoodies & Sweatshirts',
    slug: 'hoodies-sweatshirts',
    description: '450 GSM organic French terry cotton hoodies built for year-round effortless layering.',
    subcategories: ['Pullover Hoodies', 'Zip Hoodies', 'Crewneck Sweatshirts'],
    displayOrder: 4,
    image: {
      public_id: 'seed_cat_hoodies',
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'Jackets & Outerwear',
    slug: 'jackets-outerwear',
    description: 'Structured overshirts, utility jackets, chore coats, and lightweight bombers.',
    subcategories: ['Bomber Jackets', 'Utility Jackets', 'Wool Overshirts', 'Trench Coats'],
    displayOrder: 5,
    image: {
      public_id: 'seed_cat_jackets',
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'Trousers & Chinos',
    slug: 'trousers-chinos',
    description: 'Pleated tailored trousers, casual relaxed chinos, and minimal everyday pants.',
    subcategories: ['Pleated Trousers', 'Straight Chinos', 'Drawstring Pants'],
    displayOrder: 6,
    image: {
      public_id: 'seed_cat_trousers',
      url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    },
  },
  {
    name: 'Combo Sets & Bundles',
    slug: 'combo-sets',
    description: 'Curated 2-piece and 3-piece wardrobe bundles at exclusive bundle savings.',
    subcategories: ['Shirt & Trouser Duos', 'Tee Bundles', 'Layering Combos'],
    displayOrder: 7,
    image: {
      public_id: 'seed_cat_combos',
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    },
  },
];

const bannersData = [
  {
    title: 'THE AUTUMN / WINTER 2026 EDIT',
    subtitle: 'Meticulously crafted tailoring, 100% natural fibers, and contemporary architectural cuts.',
    badgeText: 'SEASON EXCLUSIVE',
    image: {
      public_id: 'banner_hero_1',
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    },
    ctaText: 'SHOP NEW ARRIVALS',
    ctaLink: '/shop?tag=new',
    secondaryCtaText: 'DISCOVER LOOKBOOK',
    secondaryCtaLink: '/shop',
    position: 'hero',
    displayOrder: 1,
    isActive: true,
  },
  {
    title: 'MINIMAL LUXURY ESSENTIALS',
    subtitle: 'From 450 GSM French terry hoodies to breathable Italian linen overshirts.',
    badgeText: 'BESTSELLERS',
    image: {
      public_id: 'banner_hero_2',
      url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
    },
    ctaText: 'EXPLORE BEST SELLERS',
    ctaLink: '/shop?tag=bestseller',
    secondaryCtaText: 'VIEW COMBOS',
    secondaryCtaLink: '/shop?tag=combo',
    position: 'hero',
    displayOrder: 2,
    isActive: true,
  },
];

const couponsData = [
  {
    code: 'WELCOME10',
    description: '10% discount on your first order with no minimum limit',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    maxDiscount: 500,
    expiryDate: new Date('2028-12-31'),
    usageLimit: 10000,
    perCustomerLimit: 1,
    isActive: true,
  },
  {
    code: 'AURA500',
    description: 'Flat ₹500 off on shopping bags above ₹2,499',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 2499,
    expiryDate: new Date('2028-12-31'),
    usageLimit: 5000,
    perCustomerLimit: 2,
    isActive: true,
  },
  {
    code: 'FREESHIP',
    description: 'Free express shipping on all orders',
    discountType: 'free_shipping',
    discountValue: 99,
    minOrderValue: 0,
    expiryDate: new Date('2028-12-31'),
    usageLimit: 10000,
    perCustomerLimit: 5,
    isActive: true,
  },
];

module.exports = {
  categoriesData,
  bannersData,
  couponsData,
};
