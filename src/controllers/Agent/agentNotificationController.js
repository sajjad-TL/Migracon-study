const AgentNotification = require("../../models/Agent/AgentNotification");

// Get notifications for agent
const getAgentNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ 
        message: "Agent ID is required", 
        success: false 
      });
    }

    console.log(`📥 Fetching notifications for agent: ${userId}`);
    
    const notifications = await AgentNotification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent performance issues
    
    const count = await AgentNotification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    console.log(`📊 Found ${notifications.length} notifications, ${count} unread`);
    
    res.json({
      notifications,
      count,
      success: true
    });
  } catch (err) {
    console.error("❌ Get notification error:", err);
    res.status(500).json({ 
      message: "Error fetching notifications", 
      success: false,
      error: err.message 
    });
  }
};

// Create a notification
const createAgentNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    
    // Validate required fields
    if (!userId || !message || !type) {
      return res.status(400).json({ 
        message: "Missing required fields (userId, message, type)", 
        success: false 
      });
    }

    console.log(`📝 Creating notification for agent: ${userId}`);
    
    const notification = new AgentNotification({ 
      userId, 
      message, 
      type,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();
    console.log(`✅ Notification created: ${notification._id}`);

    // Emit via Socket.IO to specific agent room
    const io = req.app.get("io");
    if (io) {
      const notificationData = {
        _id: notification._id,
        userId,
        message,
        type,
        isRead: false,
        createdAt: notification.createdAt
      };
      
      // Emit to specific agent room
      io.to(`agent-${userId}`).emit("notification", notificationData);
      
      // Also emit to general notification channel as fallback
      io.emit("notification", notificationData);
      
      console.log(`📡 Notification emitted to agent-${userId}`);
    }

    res.status(201).json({
      notification,
      success: true,
      message: "Notification created successfully"
    });
  } catch (err) {
    console.error("❌ Create notification error:", err);
    res.status(500).json({ 
      message: "Error creating notification", 
      success: false,
      error: err.message 
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        message: "Notification ID is required", 
        success: false 
      });
    }

    console.log(`👁️ Marking notification as read: ${id}`);
    
    const notification = await AgentNotification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        message: "Notification not found", 
        success: false 
      });
    }

    // Emit update via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`agent-${notification.userId}`).emit("notification-read", {
        notificationId: id,
        userId: notification.userId
      });
    }

    console.log(`✅ Notification marked as read: ${id}`);
    
    res.json({
      notification,
      success: true,
      message: "Notification marked as read"
    });
  } catch (err) {
    console.error("❌ Mark as read error:", err);
    res.status(500).json({ 
      message: "Error marking notification as read", 
      success: false,
      error: err.message 
    });
  }
};

// Delete a notification
const deleteAgentNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        message: "Notification ID is required", 
        success: false 
      });
    }

    console.log(`🗑️ Deleting notification: ${id}`);
    
    const notification = await AgentNotification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({ 
        message: "Notification not found", 
        success: false 
      });
    }

    // Emit deletion via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`agent-${notification.userId}`).emit("notification-deleted", {
        notificationId: id,
        userId: notification.userId
      });
    }

    console.log(`✅ Notification deleted: ${id}`);
    
    res.json({ 
      message: "Notification deleted successfully", 
      success: true 
    });
  } catch (err) {
    console.error("❌ Delete notification error:", err);
    res.status(500).json({ 
      message: "Error deleting notification", 
      success: false,
      error: err.message 
    });
  }
};

module.exports = {
  getAgentNotifications,
  createAgentNotification,
  markAsRead,
  deleteAgentNotification,
};
