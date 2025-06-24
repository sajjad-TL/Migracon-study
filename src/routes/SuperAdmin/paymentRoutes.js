const express = require('express');
const router = express.Router();
const { createPayment, getPaymentsByAgent, getLatestPaymentByAgent, getAllPayments, updatePaymentStatus, deletePayment } = require('../../controllers/SuperAdmin/paymentController')

router.post('/create', createPayment);
router.get('/by-agent/:agentId', getPaymentsByAgent);
router.get('/summary/:agentId', getLatestPaymentByAgent);
router.get('/getAllPayments', getAllPayments);
router.patch('/update/:id', updatePaymentStatus); // approve/mark complete
router.delete('/delete/:id', deletePayment); // delete payment
module.exports = router;
