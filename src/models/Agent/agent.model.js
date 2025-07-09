const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  },
  { _id: false }
);

const agentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: { type: String },
    consentAccepted: { type: Boolean, required: true },
    profilePicture: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    documents: [documentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", agentSchema);
