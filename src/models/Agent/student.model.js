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
      enum: ["Active", "Inactive", "Pending", "Rejected", "Accepted", "not-paid", "Paid", "Withdrawn", "Approved", "Doc Requested" ],
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
      validate: {
        validator: function (v) {
          return v && v.length >= 7;
        },
        message: "Phone number should be at least 7 characters"
      }
    },

    referralSource: { type: String },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Rejected", "On Hold", "Active", "Inactive", "Approved"],
      default: "New",
    },

    countryOfInterest: { type: String },
    serviceOfInterest: { type: String },
    termsAccepted: { type: Boolean, required: false, default: true },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    applications: [applicationSchema],

    // Profile image field
    profileImage: {
      filename: String,
      originalname: String,
      mimetype: String,
      path: String,
      size: Number,
      uploadedAt: Date
    },

    // Documents array for other files
    documents: [
      {
        filename: {
          type: String,
          required: true
        },
        originalname: String,
        mimetype: String,
        path: String,
        size: Number,
        uploadedAt: Date
      }
    ],

    applicationCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);