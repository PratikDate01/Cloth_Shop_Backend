const express = require('express');
const router = express.Router();
const {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBanners);
router.get('/admin', protect, authorize('admin'), getAllBannersAdmin);
router.post('/', protect, authorize('admin'), createBanner);
router.put('/:id', protect, authorize('admin'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;
