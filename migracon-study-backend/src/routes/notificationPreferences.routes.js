// routes/notificationPreferences.routes.js
const express = require("express");
const router = express.Router();
const { saveNotificationPreferences } = require("../controllers/notificationPreferencesController");

// Route to handle saving notification preferences
router.post("/notification-preferences", saveNotificationPreferences);

module.exports = router;
