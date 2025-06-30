const express = require("express");
const router = express.Router();
const {
  saveNotificationPreferences,
  getNotificationPreferences,
  deleteNotification 

} = require("../../controllers/Agent/notificationPreferencesController");

router.post("/notification-preferences", saveNotificationPreferences);
router.get("/notification-preferences/:userId", getNotificationPreferences);
router.delete('/notifications/:id', deleteNotification);

module.exports = router;
