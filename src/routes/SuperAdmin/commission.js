const express = require('express');
const router = express.Router();
const Commission = require('../../models/SuperAdmin/Commission');
const Agent = require('../../models/Agent/agent.model');
const Student = require('../../models/Agent/student.model');
const PaymentRequest = require('../../models/SuperAdmin/PaymentRequest');
const Payment = require('../../models/SuperAdmin/Payment');

// Get Dashboard Statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Total Commission
    const totalCommissionResult = await Commission.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCommission = totalCommissionResult[0]?.total || 0;

    // Pending Payouts
    const pendingPayoutsResult = await Commission.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingPayouts = pendingPayoutsResult[0]?.total || 0;

    // Count of pending payment requests
    const pendingRequestsCount = await PaymentRequest.countDocuments({ status: 'Pending' });

    // Paid This Month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const paidThisMonthResult = await Commission.aggregate([
      { 
        $match: { 
          status: 'Paid',
          $expr: {
            $and: [
              { $eq: [{ $month: '$paidDate' }, currentMonth] },
              { $eq: [{ $year: '$paidDate' }, currentYear] }
            ]
          }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paidThisMonth = paidThisMonthResult[0]?.total || 0;

    // Count of payments processed this month
    const paymentsProcessedCount = await Commission.countDocuments({
      status: 'Paid',
      $expr: {
        $and: [
          { $eq: [{ $month: '$paidDate' }, currentMonth] },
          { $eq: [{ $year: '$paidDate' }, currentYear] }
        ]
      }
    });

    // Active Agents
    const activeAgents = await Agent.countDocuments();

    // Last month comparison for total commission
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const lastMonthCommissionResult = await Commission.aggregate([
      { 
        $match: { 
          status: { $in: ['Approved', 'Paid'] },
          $expr: {
            $and: [
              { $eq: [{ $month: '$createdAt' }, lastMonth] },
              { $eq: [{ $year: '$createdAt' }, lastMonthYear] }
            ]
          }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthCommission = lastMonthCommissionResult[0]?.total || 0;
    
    const commissionGrowthPercent = lastMonthCommission > 0 
      ? Math.round(((totalCommission - lastMonthCommission) / lastMonthCommission) * 100)
      : 0;

    res.json({
      totalCommission,
      pendingPayouts,
      pendingRequestsCount,
      paidThisMonth,
      paymentsProcessedCount,
      activeAgents,
      commissionGrowthPercent
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get All Agents with Commission Data
router.get('/agents', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', country = '' } = req.query;
    
    // Build search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const agents = await Agent.find(searchFilter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const agentsWithCommissions = await Promise.all(
      agents.map(async (agent) => {
        // Total Commission
        const totalCommissionResult = await Commission.aggregate([
          { $match: { agentId: agent._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalCommission = totalCommissionResult[0]?.total || 0;

        // This Month Commission
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const thisMonthResult = await Commission.aggregate([
          { 
            $match: { 
              agentId: agent._id,
              $expr: {
                $and: [
                  { $eq: [{ $month: '$createdAt' }, currentMonth] },
                  { $eq: [{ $year: '$createdAt' }, currentYear] }
                ]
              }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const thisMonth = thisMonthResult[0]?.total || 0;

        // Pending Amount
        const pendingAmountResult = await Commission.aggregate([
          { $match: { agentId: agent._id, status: 'Approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingAmountResult[0]?.total || 0;

        // Pending Requests Count
        const pendingRequests = await PaymentRequest.countDocuments({
          agentId: agent._id,
          status: 'Pending'
        });

        // Applications Count
        const applications = await Student.countDocuments({ agentId: agent._id });

        // Successful Applications
        const successful = await Student.aggregate([
          { $match: { agentId: agent._id } },
          { $unwind: '$applications' },
          { $match: { 'applications.status': { $in: ['Accepted', 'Paid'] } } },
          { $count: 'total' }
        ]);
        const successfulCount = successful[0]?.total || 0;

        return {
          id: agent._id,
          name: `${agent.firstName} ${agent.lastName}`,
          country: agent.country || 'Not specified',
          totalCommission,
          thisMonth,
          pendingAmount,
          pendingRequests,
          applications,
          successful: successfulCount,
          status: 'Active' // You can add status field to Agent model if needed
        };
      })
    );

    const totalAgents = await Agent.countDocuments(searchFilter);

    res.json({
      agents: agentsWithCommissions,
      totalPages: Math.ceil(totalAgents / limit),
      currentPage: parseInt(page),
      totalAgents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents data' });
  }
});

// Get Agent Commission Details
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const commissions = await Commission.find({ agentId })
      .populate('studentId', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalCommissions = await Commission.countDocuments({ agentId });

    // Agent summary
    const totalEarned = await Commission.aggregate([
      { $match: { agentId: mongoose.Types.ObjectId(agentId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingAmount = await Commission.aggregate([
      { $match: { agentId: mongoose.Types.ObjectId(agentId), status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      agent: {
        id: agent._id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        totalEarned: totalEarned[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0
      },
      commissions,
      totalPages: Math.ceil(totalCommissions / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get agent details error:', error);
    res.status(500).json({ error: 'Failed to fetch agent details' });
  }
});

// Create Commission
router.post('/create', async (req, res) => {
  try {
    const { agentId, studentId, amount, type, description, program, institute } = req.body;

    const commission = new Commission({
      agentId,
      studentId,
      amount,
      type: type || 'Application Fee',
      description,
      program,
      institute,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear()
    });

    await commission.save();
    res.status(201).json({ message: 'Commission created successfully', commission });
  } catch (error) {
    console.error('Create commission error:', error);
    res.status(500).json({ error: 'Failed to create commission' });
  }
});

// Auto-generate commission when student application is accepted
router.post('/auto-generate', async (req, res) => {
  try {
    const { studentId, applicationId } = req.body;

    const student = await Student.findById(studentId);
    if (!student || !student.agentId) {
      return res.status(400).json({ error: 'Student or agent not found' });
    }

    // Find the specific application
    const application = student.applications.id(applicationId);
    if (!application) {
      return res.status(400).json({ error: 'Application not found' });
    }

    // Check if commission already exists for this application
    const existingCommission = await Commission.findOne({
      studentId,
      applicationId
    });

    if (existingCommission) {
      return res.status(400).json({ error: 'Commission already exists for this application' });
    }

    // Commission rate logic (you can customize this)
    let commissionAmount = 500; // Base commission
    if (application.program?.toLowerCase().includes('master')) {
      commissionAmount = 750;
    } else if (application.program?.toLowerCase().includes('phd')) {
      commissionAmount = 1000;
    }

    const commission = new Commission({
      agentId: student.agentId,
      studentId,
      applicationId,
      amount: commissionAmount,
      type: 'Application Fee',
      description: `Commission for ${student.firstName} ${student.lastName} - ${application.program}`,
      program: application.program,
      institute: application.institute,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear()
    });

    await commission.save();
    res.status(201).json({ message: 'Commission auto-generated successfully', commission });
  } catch (error) {
    console.error('Auto-generate commission error:', error);
    res.status(500).json({ error: 'Failed to auto-generate commission' });
  }
});

// Update Commission Status
router.put('/:commissionId/status', async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { status, approvedBy, rejectionReason } = req.body;

    const updateData = { status };
    
    if (status === 'Approved') {
      updateData.approvedBy = approvedBy;
      updateData.approvedDate = new Date();
    } else if (status === 'Paid') {
      updateData.paidDate = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const commission = await Commission.findByIdAndUpdate(
      commissionId,
      updateData,
      { new: true }
    ).populate('agentId', 'firstName lastName email');

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json({ message: 'Commission status updated successfully', commission });
  } catch (error) {
    console.error('Update commission status error:', error);
    res.status(500).json({ error: 'Failed to update commission status' });
  }
});

// Get Payment Requests
router.get('/payment-requests', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const paymentRequests = await PaymentRequest.find(filter)
      .populate('agentId', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalRequests = await PaymentRequest.countDocuments(filter);

    res.json({
      paymentRequests,
      totalPages: Math.ceil(totalRequests / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get payment requests error:', error);
    res.status(500).json({ error: 'Failed to fetch payment requests' });
  }
});

// Create Payment Request
router.post('/payment-request', async (req, res) => {
  try {
    const { agentId, amount, bankDetails, notes } = req.body;

    // Check if agent has enough pending commission
    const pendingCommissionResult = await Commission.aggregate([
      { $match: { agentId: mongoose.Types.ObjectId(agentId), status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const availableAmount = pendingCommissionResult[0]?.total || 0;
    
    if (amount > availableAmount) {
      return res.status(400).json({ 
        error: 'Requested amount exceeds available commission balance' 
      });
    }

    const paymentRequest = new PaymentRequest({
      agentId,
      amount,
      bankDetails,
      notes
    });

    await paymentRequest.save();
    res.status(201).json({ message: 'Payment request created successfully', paymentRequest });
  } catch (error) {
    console.error('Create payment request error:', error);
    res.status(500).json({ error: 'Failed to create payment request' });
  }
});

// Process Payment Request
router.put('/payment-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, processedBy, rejectionReason } = req.body;

    const updateData = { 
      status, 
      processedBy, 
      processedDate: new Date() 
    };

    if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const paymentRequest = await PaymentRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    ).populate('agentId', 'firstName lastName email');

    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    // If approved, create payment record and update commission status
    if (status === 'Paid') {
      const payment = new Payment({
        agentId: paymentRequest.agentId._id,
        amount: paymentRequest.amount,
        method: 'Bank Transfer',
        transactionId: `TXN${Date.now()}`,
        status: 'completed'
      });
      await payment.save();

      // Update related commissions to Paid status
      await Commission.updateMany(
        { 
          agentId: paymentRequest.agentId._id, 
          status: 'Approved' 
        },
        { 
          status: 'Paid', 
          paidDate: new Date() 
        }
      );
    }

    res.json({ message: 'Payment request processed successfully', paymentRequest });
  } catch (error) {
    console.error('Process payment request error:', error);
    res.status(500).json({ error: 'Failed to process payment request' });
  }
});

// Get Payment History
router.get('/payment-history', async (req, res) => {
  try {
    const { page = 1, limit = 10, agentId = '' } = req.query;
    
    let filter = { status: 'completed' };
    if (agentId) {
      filter.agentId = agentId;
    }

    const payments = await Payment.find(filter)
      .populate('agentId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ paymentDate: -1 });

    const totalPayments = await Payment.countDocuments(filter);

    res.json({
      payments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Export Reports
router.get('/export', async (req, res) => {
  try {
    const { type = 'commissions', startDate, endDate, agentId } = req.query;
    
    let filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (agentId) {
      filter.agentId = agentId;
    }

    let data = [];
    if (type === 'commissions') {
      data = await Commission.find(filter)
        .populate('agentId', 'firstName lastName email')
        .populate('studentId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else if (type === 'payments') {
      data = await Payment.find(filter)
        .populate('agentId', 'firstName lastName email')
        .sort({ paymentDate: -1 });
    }

    res.json({ data, type });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;