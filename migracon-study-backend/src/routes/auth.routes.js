const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
  registerAgent,
  loginAgent
} = require("../controllers/auth.controller");
const validateRegister = require("../middlewares/validateRegister");

router.post("/register", validateRegister, registerAgent);
router.get("/login", loginAgent);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);
router.get("/google-login", googleLogin);

module.exports = router;
