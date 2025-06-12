const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  applicationId: { type: String, required: false },
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['Application Fee', 'Enrollment', 'Bonus', 'Monthly Commission'], 
    default: 'Application Fee' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'], 
    default: 'Pending' 
  },
  month: { type: String },
  year: { type: Number },
  description: { type: String },
  approvedBy: { type: String },
  approvedDate: { type: Date },
  paidDate: { type: Date },
  program: { type: String },
  institute: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);