// Add this route in your authRoutes.js file
const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  updateAdmin,
  createAgent,
  verifyToken
} = require('../../controllers/SuperAdmin/authController');
const verifyAdminToken = require('../../middlewares/SuperAdmin/verifyAdminToken');

// Routes
router.post('/login', loginAdmin);
router.patch('/update', verifyAdminToken, updateAdmin);
router.post('/create-agent', verifyAdminToken, createAgent);
router.get('/verify-token', verifyAdminToken, verifyToken); 

module.exports = router;