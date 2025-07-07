const AgentNotification = require("../../models/Agent/AgentNotification");

// Get notifications for agent
const getAgentNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await AgentNotification.find({ userId }).sort({ createdAt: -1 });
    const count = await AgentNotification.countDocuments({ userId, isRead: false });
    
    res.json({
      notifications,
      count,
      success: true
    });
  } catch (err) {
    console.error("Get notification error:", err);
    res.status(500).json({ message: "Error fetching notifications", success: false });
  }
};

// Create a notification
const createAgentNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    
    // Validate required fields
    if (!userId || !message || !type) {
      return res.status(400).json({ message: "Missing required fields", success: false });
    }

    const notification = new AgentNotification({ 
      userId, 
      message, 
      type,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();

    // Emit via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("notification", {
        _id: notification._id,
        userId,
        message,
        type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({
      notification,
      success: true,
      message: "Notification created successfully"
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ message: "Error creating notification", success: false });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await AgentNotification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found", success: false });
    }

    res.json({
      notification,
      success: true,
      message: "Notification marked as read"
    });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ message: "Error marking notification as read", success: false });
  }
};

// Delete a notification
const deleteAgentNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await AgentNotification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found", success: false });
    }

    res.json({ 
      message: "Notification deleted successfully", 
      success: true 
    });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: "Error deleting notification", success: false });
  }
};

module.exports = {
  getAgentNotifications,
  createAgentNotification,
  markAsRead,
  deleteAgentNotification,
};