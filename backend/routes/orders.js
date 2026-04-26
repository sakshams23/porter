const express = require('express');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const router = express.Router();

// POST /api/orders - Create order
router.post('/', protect, async (req, res) => {
  try {
    const {
      packageDescription, packageWeight, packageSize, isFragile,
      pickupLocation, pickupSchedule, pickupContactName, pickupContactPhone,
      dropoffLocation, dropoffContactName, dropoffContactPhone,
    } = req.body;

    const price = calculatePrice(packageSize, pickupLocation, dropoffLocation);
    const estimatedDelivery = new Date(new Date(pickupSchedule).getTime() + 2 * 60 * 60 * 1000);

    const order = await Order.create({
      user: req.user._id,
      packageDescription, packageWeight, packageSize, isFragile,
      pickupLocation, pickupSchedule, pickupContactName, pickupContactPhone,
      dropoffLocation, dropoffContactName, dropoffContactPhone,
      estimatedDelivery, price,
      trackingEvents: [{ status: 'pending', message: 'Order placed successfully. Awaiting confirmation.', location: pickupLocation.address }],
    });

    // Notify admins
    req.io.to('admins').emit('new_order', { order, user: req.user });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders - Get user's orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/track/:orderId - Track by orderId string
router.get('/track/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function calculatePrice(size, pickup, dropoff) {
  const base = { small: 50, medium: 100, large: 180, 'extra-large': 280 };
  return (base[size] || 100) + Math.floor(Math.random() * 50);
}

module.exports = router;
