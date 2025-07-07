// agentNotification.routes.js
const express = require("express");
const {
  getAgentNotifications,
  createAgentNotification,
  markAsRead,
  deleteAgentNotification,
} = require("../../controllers/Agent/agentNotificationController");

const router = express.Router();

router.get("/:userId", getAgentNotifications);
router.post("/", createAgentNotification);
router.put("/:id/read", markAsRead); // New route for marking as read
router.delete("/:id", deleteAgentNotification);

module.exports = router;