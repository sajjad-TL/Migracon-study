// Add this route in your authRoutes.js file
const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  updateAdmin,
  createAgent,
  verifyToken  // Add this new function
} = require('../../controllers/SuperAdmin/authController');
const verifyAdminToken = require('../../middlewares/SuperAdmin/verifyAdminToken');

// Routes
router.post('/login', loginAdmin);
router.patch('/update', verifyAdminToken, updateAdmin);
router.post('/create-agent', verifyAdminToken, createAgent);
router.get('/verify-token', verifyAdminToken, verifyToken); // New route for token verification

module.exports = router;