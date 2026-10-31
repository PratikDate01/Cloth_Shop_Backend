const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');
const AdminAuditLog = require('../models/AdminAuditLog');
const { sendOrderStatusEmail } = require('../services/emailService');

/**
 * @desc    Get Admin Dashboard Analytics & Overview
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Total Revenue from all Paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.finalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Order counts by status
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['Order Placed', 'Payment Confirmed', 'Processing'] },
    });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    // Customer & Product counts
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    // Inventory status analysis
    const allProducts = await Product.find({ isActive: true });
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allProducts.forEach((p) => {
      const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
      if (totalStock === 0) outOfStockCount++;
      else if (totalStock < 10) lowStockCount++;
    });

    // Recent 6 orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('orderNumber customerInfo pricing orderStatus paymentInfo createdAt');

    // Best selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ totalSold: -1 })
      .limit(5)
      .select('name sku sellingPrice images totalSold ratingsAverage');

    // Monthly Sales Chart Data (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          'paymentInfo.status': 'PAID',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$pricing.finalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesChart = monthlySalesAgg.map((item) => ({
      month: `${months[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      orders: item.orderCount,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockCount,
        outOfStockCount,
      },
      salesChart,
      recentOrders,
      topProducts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all orders with filtering and search
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentMethod, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query['paymentInfo.status'] = paymentStatus;
    if (paymentMethod) query['paymentInfo.method'] = paymentMethod;

    if (search && search.trim() !== '') {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { 'customerInfo.fullName': { $regex: search.trim(), $options: 'i' } },
        { 'customerInfo.email': { $regex: search.trim(), $options: 'i' } },
        { 'customerInfo.phone': { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update order status, shipping courier, and tracking
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, courierName, trackingNumber, trackingUrl, estimatedDelivery, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (courierName !== undefined) order.tracking.courierName = courierName;
    if (trackingNumber !== undefined) order.tracking.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) order.tracking.trackingUrl = trackingUrl;
    if (estimatedDelivery !== undefined) order.tracking.estimatedDelivery = estimatedDelivery;

    if (orderStatus && orderStatus !== order.orderStatus) {
      order.addStatusHistory(orderStatus, note || `Status updated to ${orderStatus}`, req.user.name || 'Admin');

      // If COD delivered, mark payment as paid
      if (orderStatus === 'Delivered' && order.paymentInfo.method === 'cod') {
        order.paymentInfo.status = 'PAID';
        order.paymentInfo.paidAt = new Date();
      }

      // Send status update email to customer
      sendOrderStatusEmail(order, orderStatus).catch(() => {});
    }

    await order.save();

    // Log admin audit
    await AdminAuditLog.create({
      admin: req.user._id,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'Order',
      entityId: order._id.toString(),
      details: { newStatus: orderStatus, trackingNumber, courierName },
    });

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all customers
 * @route   GET /api/admin/customers
 * @access  Private/Admin
 */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'customer' };

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const customers = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    // Attach order summaries
    const customerStats = await Promise.all(
      customers.map(async (cust) => {
        const orderCount = await Order.countDocuments({ user: cust._id });
        const orders = await Order.find({ user: cust._id, 'paymentInfo.status': 'PAID' }).select('pricing');
        const totalSpent = orders.reduce((acc, o) => acc + o.pricing.finalAmount, 0);

        return {
          id: cust._id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          isActive: cust.isActive,
          createdAt: cust.createdAt,
          orderCount,
          totalSpent,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      customers: customerStats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle Customer Active status
 * @route   PUT /api/admin/customers/:id/toggle-status
 * @access  Private/Admin
 */
exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer account ${customer.isActive ? 'activated' : 'deactivated'}`,
      customer: { id: customer._id, isActive: customer.isActive },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Inventory SKU report
 * @route   GET /api/admin/inventory
 * @access  Private/Admin
 */
exports.getInventoryReport = async (req, res, next) => {
  try {
    const { status, search } = req.query; // 'low', 'out', 'all'
    const query = { isActive: true };

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
        { 'variants.sku': { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const products = await Product.find(query).populate('category', 'name slug');
    const flatInventory = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        let stockStatus = 'in_stock';
        if (v.stockQuantity === 0) stockStatus = 'out_of_stock';
        else if (v.stockQuantity <= 5) stockStatus = 'low_stock';

        if (!status || status === 'all' || status === stockStatus) {
          flatInventory.push({
            productId: p._id,
            productName: p.name,
            primarySku: p.sku,
            variantSku: v.sku,
            size: v.size,
            color: v.color,
            colorCode: v.colorCode,
            price: v.price || p.sellingPrice,
            stockQuantity: v.stockQuantity,
            stockStatus,
            image: p.images[0]?.url || '',
            categoryName: p.category?.name || 'Uncategorized',
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: flatInventory.length,
      inventory: flatInventory,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get return/exchange requests
 * @route   GET /api/admin/returns
 * @access  Private/Admin
 */
exports.getReturnRequests = async (req, res, next) => {
  try {
    const returns = await ReturnRequest.find()
      .populate('order', 'orderNumber customerInfo pricing orderStatus paymentInfo')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: returns.length,
      returns,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Process return request (Approve, Reject, Refund)
 * @route   PUT /api/admin/returns/:id
 * @access  Private/Admin
 */
exports.processReturnRequest = async (req, res, next) => {
  try {
    const { status, adminNotes, pickupCourier, pickupTrackingNumber } = req.body;
    const request = await ReturnRequest.findById(req.params.id).populate('order');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Return request not found' });
    }

    request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    if (pickupCourier) request.pickupTracking.courierName = pickupCourier;
    if (pickupTrackingNumber) request.pickupTracking.trackingNumber = pickupTrackingNumber;

    await request.save();

    // Update parent order status history
    if (request.order) {
      request.order.addStatusHistory(
        status === 'APPROVED' ? 'Return Approved' : status,
        `Return request marked as ${status}. ${adminNotes || ''}`,
        req.user.name || 'Admin'
      );
      await request.order.save();
    }

    res.status(200).json({
      success: true,
      message: 'Return request updated successfully',
      returnRequest: request,
    });
  } catch (err) {
    next(err);
  }
};
