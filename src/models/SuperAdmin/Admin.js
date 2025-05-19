const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
  otpExpiry: Date,
  otpVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('Admin', adminSchema);
