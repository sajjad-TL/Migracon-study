const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const sendEmail = require("../utils/sendEmail"); // Add this utility

// Register User
const registerUser = async (req, res) => {
  const { firstName, lastName, phone, email, password, consentAccepted } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      consentAccepted,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, try again later" });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.jwt_secret_key, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login success",
      userId: user._id,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error, try again later" });
  }
};

// Forgot Password (Send OTP)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const hash = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendEmail(user.email, "Password Reset Code", `Your OTP is: ${otp}`);

    return res.status(200).json({
      message: "OTP has been sent to your email",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  const hash = crypto.createHash("sha256").update(code).digest("hex");

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired code" });

    return res.status(200).json({ message: "Code verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!password || !confirmPassword || password !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match or are missing",
    });
  }

  try {
    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired session" });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
};
