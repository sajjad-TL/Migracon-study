const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    citizenOf: { type: String, required: true },
    passportNumber: { type: String, required: true },
    passportExpiryDate: { type: Date, required: true },
    gender: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: { type: String, required: true },
    referralSource: { type: String },
    status: { type: String },
    countryOfInterest: { type: String },
    serviceOfInterest: { type: String },
    conditionsAccepted: { type: Boolean, required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
