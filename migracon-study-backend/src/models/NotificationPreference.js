// models/NotificationPreference.js
const mongoose = require("mongoose");

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String, 
    required: true
  },
  notificationType: {
    type: String,
    required: true
  },
  emailFrequency: {
    type: String,
    required: true
  },
  mobileNotifications: {
    type: Boolean,
    required: true
  }
});

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);

module.exports = NotificationPreference;
