const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  access: {
    type: String,
    required: true,
    enum: ['Full Access', 'Limited Access', 'Read Only'],
    default: 'Limited Access'
  },
  permissions: {
    viewApplications: { type: Boolean, default: true },
    manageApplications: { type: Boolean, default: false },
    downloadDocuments: { type: Boolean, default: false },
    acceptRejectApplications: { type: Boolean, default: false },
    requestAdditionalDocuments: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    systemSettings: { type: Boolean, default: false }
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);