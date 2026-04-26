const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  landmark: { type: String },
});

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, required: true },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Package details
  packageDescription: { type: String, required: true },
  packageWeight: { type: String },
  packageSize: { type: String, enum: ['small', 'medium', 'large', 'extra-large'], default: 'medium' },
  isFragile: { type: Boolean, default: false },
  
  // Pickup
  pickupLocation: { type: locationSchema, required: true },
  pickupSchedule: { type: Date, required: true },
  pickupContactName: { type: String },
  pickupContactPhone: { type: String },
  
  // Dropoff
  dropoffLocation: { type: locationSchema, required: true },
  dropoffContactName: { type: String },
  dropoffContactPhone: { type: String },
  estimatedDelivery: { type: Date },
  
  // Status & tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'on_hold'],
    default: 'pending',
  },
  trackingEvents: [trackingEventSchema],
  
  // Live location
  currentLocation: {
    lat: Number,
    lng: Number,
    address: String,
    updatedAt: Date,
  },
  
  // Admin
  assignedDriver: { type: String },
  adminNotes: { type: String },
  stoppedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stoppedAt: { type: Date },
  stopReason: { type: String },
  
  // Pricing
  price: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    this.orderId = 'PRT' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
