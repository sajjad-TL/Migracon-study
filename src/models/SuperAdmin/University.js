const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema({
  universityId: String,
  name: String,
  email: String,
  contactPerson: String,
  role: {
    type: String,
    enum: ["University Admin", "Super Admin", "Viewer"],
    default: "Viewer"
  },
  lastLogin: Date,
  status: {
    type: String,
    enum: ["Active", "Pending", "Suspended"],
    default: "Pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("University", universitySchema);
