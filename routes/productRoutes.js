const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/:identifier', getProduct);
router.get('/:id/related', getRelatedProducts);

// Admin protected endpoints
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.post('/:id/adjust-stock', protect, authorize('admin'), adjustStock);

module.exports = router;
