const NotificationPreference = require("../../models/Agent/NotificationPreference");
const nodemailer = require("nodemailer");
const User = require("../../models/Agent/agent.model");
require("dotenv").config();


// POST: Save Preferences
const saveNotificationPreferences = async (req, res) => {
  const { userId, notificationType, emailFrequency, mobileNotifications } = req.body;
  const io = req.app.get("io");

  try {
    const newPreference = new NotificationPreference({
      userId,
      notificationType,
      emailFrequency,
      mobileNotifications,
    });

    await newPreference.save();
    io.emit("notification", {
      type: notificationType,
      message: `New notification preference saved: ${notificationType}`,
      userId,
      emailFrequency,
      mobileNotifications,
      createdAt: new Date(),
    });

    if (emailFrequency !== "Never") {
      sendEmailNotification(userId, notificationType, emailFrequency);
    }

    res.status(200).json({ message: "Preferences saved successfully!" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: `Failed to save preferences. ${error.message}` });
  }
};


// GET: Retrieve Preferences & Count by User ID (Unified)
const getNotificationPreferences = async (req, res) => {
  const { userId } = req.params;

  try {
    const preferences = await NotificationPreference.find({ userId });
    const count = preferences.length;

    res.status(200).json({
      count,
      preferences,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences and count" });
  }
};

// Send email notification
const sendEmailNotification = async (userId, notificationType, frequency) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER_APPLYBOARD,
        pass: process.env.EMAIL_PASS_APPLYBOARD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER_APPLYBOARD,
      to: user.email,
      subject: `Notification: ${notificationType}`,
      text: `You have a new ${notificationType} notification. Frequency: ${frequency}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// DELETE: Delete a specific notification by ID
const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await NotificationPreference.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ error: "Failed to delete notification" });
  }
};


module.exports = {
  saveNotificationPreferences,
  getNotificationPreferences,
  deleteNotification
};
