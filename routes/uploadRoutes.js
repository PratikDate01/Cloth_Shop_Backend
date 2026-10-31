const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  uploadSingle,
  uploadProductImages,
  deleteImage,
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Upload single image (for Category, Banner, Logo, Favicon)
router.post('/single', upload.single('image'), uploadSingle);

// Upload multiple product images from device
router.post('/product-images', upload.array('images', 8), uploadProductImages);

// Delete image by public ID
router.delete('/:publicId', deleteImage);

module.exports = router;
