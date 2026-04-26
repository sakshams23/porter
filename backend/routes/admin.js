const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect, adminOnly);

// GET /api/admin/orders - All orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, pending, inTransit, delivered, cancelled, users] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ role: 'user' }),
    ]);
    res.json({ total, pending, inTransit, delivered, cancelled, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/orders/:id/status - Update status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, message, location } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.trackingEvents.push({
      status, message: message || getDefaultMessage(status),
      location: location || order.currentLocation?.address,
      updatedBy: req.user._id,
    });
    if (status === 'on_hold' || status === 'cancelled') {
      order.stoppedBy = req.user._id;
      order.stoppedAt = new Date();
      order.stopReason = req.body.reason || '';
    }
    await order.save();

    // Emit to user
    req.io.to(`user_${order.user.toString()}`).emit('order_update', {
      orderId: order._id,
      status: order.status,
      trackingEvent: order.trackingEvents[order.trackingEvents.length - 1],
    });
    req.io.to('admins').emit('order_status_changed', { orderId: order._id, status });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/orders/:id - Edit order data
router.put('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    req.io.to(`user_${order.user._id.toString()}`).emit('order_updated', { orderId: order._id });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/orders/:id/location - Update live location
router.put('/orders/:id/location', async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { lat, lng, address, updatedAt: new Date() } },
      { new: true }
    );
    req.io.to(`user_${order.user.toString()}`).emit('location_update', {
      orderId: order._id, lat, lng, address,
    });
    res.json({ message: 'Location updated', currentLocation: order.currentLocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getDefaultMessage(status) {
  const msgs = {
    confirmed: 'Your order has been confirmed. A porter will be assigned shortly.',
    picked_up: 'Package picked up from the sender.',
    in_transit: 'Package is on the way.',
    out_for_delivery: 'Package is out for delivery. Expect delivery soon.',
    delivered: 'Package delivered successfully.',
    cancelled: 'Order has been cancelled.',
    on_hold: 'Package delivery is temporarily on hold.',
  };
  return msgs[status] || 'Status updated.';
}

module.exports = router;
