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
      enum: ["Active", "Inactive", "Pending"],
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
      // Phone validation ko remove kar diya - ab koi bhi format accept karega
      validate: {
        validator: function(v) {
          // Agar phone number hai to kam se kam 7 characters hone chahiye
          return v && v.length >= 7;
        },
        message: "Phone number should be at least 7 characters"
      }
    },

    referralSource: { type: String },

    status: {
      type: String,
      enum: ["New", "In Progress", "Completed", "Rejected", "On Hold", "Active", "Inactive"],
      default: "New",
    },

    countryOfInterest: { type: String },
    serviceOfInterest: { type: String },
    
    // termsAccepted ko required false kar diya aur default true set kar diya
    termsAccepted: { type: Boolean, required: false, default: true },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    applications: [applicationSchema],

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