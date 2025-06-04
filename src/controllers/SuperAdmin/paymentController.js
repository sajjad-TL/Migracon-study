const Payment = require('../../models/SuperAdmin/Payment');
const sendEmail = require('../../utils/Agent/sendEmail');

const createPayment = async (req, res) => {
  try {
    const { agentId, amount, method, transactionId } = req.body;

    // 💡 Validate required fields
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

    // Send Email
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


module.exports = {
  createPayment,
  getPaymentsByAgent,
  getLatestPaymentByAgent, 
};
