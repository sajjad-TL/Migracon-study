 const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  phone:     { type: String},
  email:     { type: String, required: true, unique: true,  match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"] },
  password:  { type: String},
  consentAccepted: { type: Boolean, required: true },
  profilePicture : {type : String},
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  }, { timestamps: true });

module.exports = mongoose.model("Agent", agentSchema);
