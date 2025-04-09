const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { firstName, lastName, phone, email, password, consentAccepted } =
    req.body;

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

    res
      .status(201)
      .json({ message: "User registered successfully", userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, try again later" });
  }
};

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

    return res
      .status(200)
      .json({ message: "Login success", userId: user._id, token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error, try again later" });
  }
};

module.exports = { registerUser, loginUser };
