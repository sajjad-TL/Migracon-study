const express = require('express');
const router = express.Router();
const { loginAdmin, updateAdmin, createAgent } = require('../../controllers/SuperAdmin/authController');

// Routes
router.post('/login', loginAdmin);
router.patch('/update', updateAdmin);
router.post('/create-agent', createAgent);

module.exports = router;
