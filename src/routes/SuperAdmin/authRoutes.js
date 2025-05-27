const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  updateAdmin,
  createAgent
} = require('../../controllers/SuperAdmin/authController');
// const verifyAdminToken = require('../../middlewares/SuperAdmin/verifyAdminToken');

// Routes
router.post('/login', loginAdmin); // Public
// router.patch('/update', verifyAdminToken, updateAdmin); // Protected
// router.post('/create-agent', verifyAdminToken, createAgent); // Protected

module.exports = router;
