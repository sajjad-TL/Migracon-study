const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
  registerAgent,
  loginAgent,
  validateTokenRoute
} = require("../../controllers/Agent/auth.controller");
const validateRegister = require("../../middlewares/Agent/validateRegister");
const verifyToken = require("../../middlewares/Agent/verifyTOken");

router.post("/register", validateRegister, registerAgent);
router.post("/login", loginAgent);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin);

router.get("/validate-token", verifyToken, validateTokenRoute);

module.exports = router;
