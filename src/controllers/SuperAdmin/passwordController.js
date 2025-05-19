const Admin = require('../../models/SuperAdmin/Admin');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Step 1: Send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    await admin.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER_ADMIN,
        pass: process.env.EMAIL_PASS_ADMIN,
      },
    });

    await transporter.sendMail({
      to: admin.email,
      subject: 'Your OTP for Password Reset',
      html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Step 2: Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const admin = await Admin.findOne({ email });

    if (!admin || admin.otp !== otp || admin.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    admin.otpVerified = true; // temporarily mark as verified
    await admin.save();

    res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });

    if (!admin || !admin.otpVerified) {
      return res.status(400).json({ message: 'OTP not verified' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    admin.otpVerified = false;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
