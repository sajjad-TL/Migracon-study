 const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  phone:     { type: String},
  email:     { type: String, required: true, unique: true },
  password:  { type: String},
  consentAccepted: { type: Boolean, required: true },
  profilePicture : {type : String},
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  }, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
