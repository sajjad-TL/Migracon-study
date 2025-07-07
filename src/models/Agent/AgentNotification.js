// models/AgentNotification.js
const mongoose = require("mongoose");

const agentNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent", // Reference your agent model
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String, // e.g., "Notes", "Messages", etc.
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AgentNotification", agentNotificationSchema);
