const express = require('express');
const router = express.Router();
const { createPayment, getPaymentsByAgent, getLatestPaymentByAgent } = require('../../controllers/SuperAdmin/paymentController')

router.post('/create', createPayment);
router.get('/by-agent/:agentId', getPaymentsByAgent);
router.get('/summary/:agentId', getLatestPaymentByAgent);

module.exports = router;
