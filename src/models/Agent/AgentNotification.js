const mongoose = require("mongoose");

const agentNotificationSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String to match your usage
    required: true,
    index: true // Add index for better query performance
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Notes', 'Messages', 'Reminders', 'Updates', 'Document Request'], // Add validation
    default: 'Updates'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true // Add index for unread count queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Add index for sorting
  }
});

// Add compound index for efficient queries
agentNotificationSchema.index({ userId: 1, createdAt: -1 });
agentNotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("AgentNotification", agentNotificationSchema);
