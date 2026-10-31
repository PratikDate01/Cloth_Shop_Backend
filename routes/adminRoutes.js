const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  toggleCustomerStatus,
  getInventoryReport,
  getReturnRequests,
  processReturnRequest,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/customers', getAllCustomers);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);
router.get('/inventory', getInventoryReport);
router.get('/returns', getReturnRequests);
router.put('/returns/:id', processReturnRequest);

module.exports = router;
