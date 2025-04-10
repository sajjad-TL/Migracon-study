// utils/sendEmail.js

const sendEmail = async (to, subject, message) => {
    // In production, you’d use nodemailer/sendgrid/etc.
    console.log(`--- Email Sent ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
  };
  
  module.exports = sendEmail;
  