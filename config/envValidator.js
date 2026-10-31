/**
 * Validates critical environment variables before server starts up.
 * Ensures security best-practices and avoids runtime failures in production.
 */
const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const warnings = [];
  const errors = [];

  // Required database configuration
  if (!process.env.MONGODB_URI) {
    if (isProd) {
      errors.push('MONGODB_URI is required in production environment.');
    } else {
      warnings.push('MONGODB_URI not set; falling back to local or in-memory MongoDB.');
    }
  }

  // Critical JWT security check
  const jwtSecret = process.env.JWT_SECRET;
  const defaultSecret = 'super_secret_jwt_cloth_shop_key_2026_change_in_production';
  if (!jwtSecret) {
    if (isProd) {
      errors.push('JWT_SECRET must be defined in production.');
    } else {
      warnings.push('JWT_SECRET is not set; using development fallback.');
    }
  } else if (isProd && (jwtSecret === defaultSecret || jwtSecret.length < 32)) {
    errors.push('In production, JWT_SECRET must be a strong secret of at least 32 characters, and not the default placeholder.');
  }

  // Cloudinary credentials check
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    warnings.push('Cloudinary credentials missing. Image uploads will fall back to local disk storage.');
  }

  // Razorpay credentials check
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
    warnings.push('Razorpay credentials not configured or using placeholders. Payments will run in mock/test mode.');
  }

  // Log warnings if any
  if (warnings.length > 0) {
    console.log('⚠️  Environment Configuration Notice:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  // If hard errors in production, abort startup
  if (errors.length > 0) {
    console.error('\n🚨 FATAL CONFIGURATION ERROR(S):');
    errors.forEach((e) => console.error(`   ❌ ${e}`));
    console.error('\nPlease fix the environment variables in your deployment settings or .env file before starting.\n');
    process.exit(1);
  }
};

module.exports = validateEnv;
