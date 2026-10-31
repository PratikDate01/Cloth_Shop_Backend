const Razorpay = require('razorpay');

let razorpayInstance = null;

const isRazorpayConfigured = () => {
  return (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key' &&
    process.env.RAZORPAY_KEY_ID.trim() !== '' &&
    process.env.RAZORPAY_KEY_SECRET.trim() !== ''
  );
};

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (isRazorpayConfigured()) {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      // In development placeholder mode, initialize Razorpay with key strings to prevent crash on import
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
      });
    }
  }
  return razorpayInstance;
};

module.exports = {
  getRazorpayInstance,
  isRazorpayConfigured,
};
