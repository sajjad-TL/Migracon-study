const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER_APPLYBOARD,
        pass: process.env.EMAIL_PASS_APPLYBOARD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER_APPLYBOARD,
      to,
      subject,
      html,
    });

    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
