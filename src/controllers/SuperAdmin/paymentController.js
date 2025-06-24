const Payment = require('../../models/SuperAdmin/Payment');
const sendEmail = require('../../utils/Agent/sendEmail');

const createPayment = async (req, res) => {
  try {
    const { agentId, amount, method, transactionId } = req.body;


    if (!agentId || !amount || !method || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const allowedMethods = ['bank', 'paypal', 'wire', 'JazzCash'];
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    const payment = new Payment({
      agentId,
      amount: numericAmount,
      method,
      transactionId,
      status: 'pending',
      paymentDate: new Date(),
    });

    await payment.save();

    
    await sendEmail(
      'shakeel.sakha@tecklogics.com',
      'New Payment Received',
      `You received $${numericAmount} via ${method}.`
    );

    // Emit WebSocket event
    if (global.io) {
      global.io.to(agentId.toString()).emit('newPayment', {
        message: `You’ve received a new payment of $${numericAmount}`,
        payment,
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
};


const getPaymentsByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const payments = await Payment.find({ agentId });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Fetching payments failed' });
  }
};

const getLatestPaymentByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    const latestPayment = await Payment.findOne({ agentId })
      .sort({ createdAt: -1 });

    if (!latestPayment) {
      return res.status(404).json({ error: 'No payments found for this agent' });
    }

    res.status(200).json(latestPayment);
  } catch (error) {
    console.error('Error fetching latest payment:', error);
    res.status(500).json({ error: 'Fetching latest payment failed' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }); 
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};


const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Processing', 'Completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updated = await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

// ✅ Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Payment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};


module.exports = {
  createPayment,
  getPaymentsByAgent,
  getLatestPaymentByAgent, 
  getAllPayments,
  updatePaymentStatus,  // ✅ include this
  deletePayment
};
