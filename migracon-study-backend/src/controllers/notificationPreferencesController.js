const NotificationPreference = require("../models/NotificationPreference");
const nodemailer = require("nodemailer");
const User = require("../models/agent.model");  // Import the User model
require("dotenv").config();  // To load environment variables

// Controller function to save notification preferences
const saveNotificationPreferences = async (req, res) => {
  const { userId, notificationType, emailFrequency, mobileNotifications } = req.body;

  try {
    // Save the preferences to the database
    const newPreference = new NotificationPreference({
      userId,
      notificationType,
      emailFrequency,
      mobileNotifications,
    });
    await newPreference.save();

    // Handle sending email notifications based on preferences
    if (emailFrequency !== "Never") {
      sendEmailNotification(userId, notificationType, emailFrequency);
    }

    res.status(200).json({ message: "Preferences saved successfully!" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: `Failed to save preferences. ${error.message}` });
  }
};

// Function to send an email notification
const sendEmailNotification = async (userId, notificationType, frequency) => {
  try {
    // Fetch user email from the database based on userId
    const user = await User.findById(userId);  // Fetch user from DB
    if (!user) {
      throw new Error("User not found");
    }

    const userEmail = user.email;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail, // Dynamically sending email to the user
      subject: `Notification: ${notificationType}`,
      text: `You have a new ${notificationType} notification. Frequency: ${frequency}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { saveNotificationPreferences };
