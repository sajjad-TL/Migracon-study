const express = require('express');
const router = express.Router();
const { loginAdmin, updateAdmin, createAgent } = require('../../controllers/SuperAdmin/authController');

// Routes
router.post('/login', loginAdmin);    // Admin login or first-time registration
router.patch('/update', updateAdmin); // Admin update route
router.post('/create-agent', createAgent);

module.exports = router;
