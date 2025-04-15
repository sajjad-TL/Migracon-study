const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
  registerAgent,
  loginAgent,
  updateAgent,
} = require("../controllers/agent.controller");
const validateRegister = require("../middlewares/validateRegister");

router.post("/register", validateRegister, registerAgent);
router.post("/login", loginAgent);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin);
router.patch("/update", updateAgent);

module.exports = router;
