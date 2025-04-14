const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
} = require("../controllers/auth.controller");
const validateRegister = require("../middlewares/validateRegister");

router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin);

module.exports = router;
