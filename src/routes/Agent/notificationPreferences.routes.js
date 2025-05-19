const express = require("express");
const router = express.Router();
const {
  saveNotificationPreferences,
  getNotificationPreferences,
} = require("../../controllers/Agent/notificationPreferencesController");

// POST: Save preferences
router.post("/notification-preferences", saveNotificationPreferences);

// GET: Preferences + Count by userId (unified)
router.get("/notification-preferences/:userId", getNotificationPreferences);

module.exports = router;
