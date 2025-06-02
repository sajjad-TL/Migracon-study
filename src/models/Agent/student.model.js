const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    paymentDate: { type: Date },
    applicationId: { type: String },
    applyDate: { type: Date },
    program: { type: String },
    institute: { type: String },
    startDate: { type: Date },
    status: {
      type: String,
      enum: ["Pending", "Submitted", "Approved", "Rejected"],
      default: "Pending",
    },
    requirements: { type: String },
    requirementspartner: { type: String },
    currentStage: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    filename: { type: String },
    originalName: { type: String },
    fileType: { type: String },
    filePath: { type: String },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    citizenOf: { type: String, required: true },
    passportNumber: { type: String, required: true },
    passportExpiryDate: { type: Date, required: true },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
    },

    referralSource: { type: String },

    status: {
      type: String,
      enum: ["New", "In Progress", "Completed", "Rejected", "On Hold"],
      default: "New",
    },

    countryOfInterest: { type: String },
    serviceOfInterest: { type: String },
    termsAccepted: { type: Boolean, required: true },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    applications: [applicationSchema],

    documents: [
      {
    filename: { type: String },
    originalName: { type: String },
    fileType: { type: String },
    filePath: { type: String },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
    ],

    applicationCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
