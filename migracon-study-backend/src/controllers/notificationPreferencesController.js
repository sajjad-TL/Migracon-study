const NotificationPreference = require("../models/NotificationPreference");
const nodemailer = require("nodemailer");
const User = require("../models/agent.model"); // Agent model
require("dotenv").config();

// POST: Save Preferences
const saveNotificationPreferences = async (req, res) => {
  const { userId, notificationType, emailFrequency, mobileNotifications } = req.body;

  try {
    const newPreference = new NotificationPreference({
      userId,
      notificationType,
      emailFrequency,
      mobileNotifications,
    });
    await newPreference.save();

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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
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

module.exports = {
  saveNotificationPreferences,
  getNotificationPreferences,
};
