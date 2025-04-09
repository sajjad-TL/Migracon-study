const { isStrongPassword, isValidEmail } = require('../utils/validators');

module.exports = (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    password,
    consentAccepted
  } = req.body;

  if (!firstName || !lastName || !phone || !email  || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

 

  if (!isStrongPassword(password, firstName, lastName)) {
    return res.status(400).json({
      message:
        'Password must be at least 12 characters, include upper/lowercase, a number, a symbol, and not contain your name.',
    });
  }

  if (!consentAccepted) {
    return res.status(400).json({ message: 'Consent must be accepted to register.' });
  }

  next();
};
