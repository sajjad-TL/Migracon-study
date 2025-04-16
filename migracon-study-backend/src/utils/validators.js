const validator = require("validator");

const isValidEmail = (email, confirmEmail) => {
  return validator.isEmail(email) && email === confirmEmail;
};

const isStrongPassword = (password, firstName, lastName) => {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[\W]/.test(password) &&
    !password.toLowerCase().includes(firstName.toLowerCase()) &&
    !password.toLowerCase().includes(lastName.toLowerCase())
  );
};

module.exports = { isStrongPassword, isValidEmail };
