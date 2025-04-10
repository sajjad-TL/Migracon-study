const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
} = require("../controllers/auth.controller");
const validateRegister = require("../middlewares/validateRegister");

router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

module.exports = router;
