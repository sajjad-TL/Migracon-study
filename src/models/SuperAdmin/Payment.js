const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  transactionId: { type: String, required: true },
  status: { type: String, default: 'pending' },
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });


module.exports = mongoose.model('Payment', paymentSchema);
