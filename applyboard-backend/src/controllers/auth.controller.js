 
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const registerUser = async (req, res) => {
  const { firstName, lastName, phone, email, password, consentAccepted } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      consentAccepted,
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error, try again later' });
  }
};

module.exports = { registerUser };
