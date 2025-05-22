const mongoose = require("mongoose");

// Sub-schema for applications
const applicationSchema = new mongoose.Schema({
  paymentDate: { type: Date },
  applicationId: { type: String },
  applyDate: { type: Date },
  program: { type: String },
  institute: { type: String },
  startDate: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "Submitted", "Accepted", "Rejected", "In Progress", "Completed"],
    default: "Pending",
  },
  requirements: { type: String },
  requirementspartner: { type: String },
  currentStage: { type: String },
}, { _id: false }); // prevent MongoDB from auto-adding _id to subdocs if not needed

// Main student schema
const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  citizenOf: { type: String, required: true },
  passportNumber: { type: String, required: true },
  passportExpiryDate: { type: Date, required: true },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"],
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  phoneNumber: { type: String, required: true },
  referralSource: { type: String },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Pending", "Rejected", "Approved"],
    default: "Pending",
  },
  countryOfInterest: { type: String },
  serviceOfInterest: { type: String },
  conditionsAccepted: { type: Boolean, required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  applications: [applicationSchema],
  applicationCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
