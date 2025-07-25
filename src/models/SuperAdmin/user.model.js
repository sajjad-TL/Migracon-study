const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  fullName: { type: String, required: true, trim: true },
  jobTitle: { type: String, required: true, trim: true },
  emailAddress: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  secondaryEmail: { type: String, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Super Admin', 'University Admin', 'Admissions Officer'],
    default: 'University Admin'
  },
  permissions: {
    viewStudentApplications: { type: Boolean, default: false },
    manageApplicationStatus: { type: Boolean, default: false },
    downloadStudentDocuments: { type: Boolean, default: false },
    acceptRejectApplications: { type: Boolean, default: false },
    requestAdditionalDocuments: { type: Boolean, default: false },
    manageEducationPrograms: { type: Boolean, default: false }
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
    default: 'Active'
  },
  accountExpiryDate: { type: Date },
  emailNotifications: { type: Boolean, default: false },
  forcePasswordChange: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $unset: { lockUntil: 1 }, $set: { loginAttempts: 1 } });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $unset: { loginAttempts: 1, lockUntil: 1 } });
};

module.exports = mongoose.model('UserAccess', userSchema);
