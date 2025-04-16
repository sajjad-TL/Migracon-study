const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Agent = require("../models/agent.model");
const sendEmail = require("../utils/sendEmail"); // Add this utility
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register User
const registerAgent = async (req, res) => {
  const { firstName, lastName, phone, email, password, consentAccepted } =
    req.body;

  try {
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent)
      return res.status(400).json({ message: "Agent already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const agent = await Agent.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      consentAccepted,
      profilePicture: null,
    });

    res.status(201).json({
      message: "Agent registered successfully",
      agentId: agent._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, try again later" });
  }
};

// Login User
const loginAgent = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(404).json({ message: "Email not found" });

    const isPasswordValid = await bcrypt.compare(password, agent.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: agent._id }, process.env.jwt_secret_key, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      agentId: agent._id,
      name: `${agent.firstName} ${agent.lastName}`,
      profilePicture: agent.profilePicture ? agent.profilePicture : null,
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
    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash("sha256").update(otp).digest("hex");

    agent.resetPasswordToken = hash;
    agent.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await agent.save();

    const emailContent = `<h2>Your password reset code</h2><p><strong>${otp}</strong> is your OTP. It expires in 10 minutes.</p>`;

    await sendEmail(agent.email, "Password Reset Code", emailContent);

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
    const agent = await Agent.findOne({
      email,
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!agent)
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
    const agent = await Agent.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!agent)
      return res.status(400).json({ message: "Invalid or expired session" });

    agent.password = await bcrypt.hash(password, 12);
    agent.resetPasswordToken = undefined;
    agent.resetPasswordExpires = undefined;
    await agent.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, given_name, family_name, picture } = ticket.getPayload();

    let agent = await Agent.findOne({ email });

    if (!agent) {
      agent = await Agent.create({
        email,
        firstName: given_name,
        lastName: family_name,
        password: "",
        consentAccepted: true,
        phone: "",
        profilePicture: picture,
      });
    }

    const jwtToken = jwt.sign({ id: agent._id }, process.env.jwt_secret_key, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      agentId: agent._id,
      name: `${agent.firstName} ${agent.lastName}`,
      profilePicture: agent.profilePicture ? agent.profilePicture : null,
      token: jwtToken,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: err });
  }
};

module.exports = {
  registerAgent,
  loginAgent,
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
};
