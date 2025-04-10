 
const express = require('express');
const router = express.Router();
const { registerUser ,loginUser, forgotPassword, resetPassword} = require('../controllers/auth.controller');
const validateRegister = require('../middlewares/validateRegister');

router.post('/register', validateRegister, registerUser);
router.post('/login', loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


module.exports = router;
