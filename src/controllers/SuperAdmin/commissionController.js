const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Commission = require('../../models/SuperAdmin/Commission');
const Agent = require('../../models/Agent/agent.model');
const Student = require('../../models/Agent/student.model');
const PaymentRequest = require('../../models/SuperAdmin/PaymentRequest');
const Payment = require('../../models/SuperAdmin/Payment');

router.get('/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const totalCommissionResult = await Commission.aggregate([
      { $match: { status: { $in: ['Approved', 'Paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCommission = totalCommissionResult[0]?.total || 0;

    console.log('Total Commission:', totalCommission);

    const pendingPayoutsResult = await Commission.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const pendingPayouts = pendingPayoutsResult[0]?.total || 0;
    const pendingPayoutsCount = pendingPayoutsResult[0]?.count || 0;

    const pendingRequestsCount = await PaymentRequest.countDocuments({ status: 'Pending' });

    let paidThisMonth = 0;
    let paymentsProcessedCount = 0;

    const paidThisMonthWithPaidDate = await Commission.aggregate([
      {
        $match: {
          status: 'Paid',
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Paid This Month with paidDate:', paidThisMonthWithPaidDate);


    if (paidThisMonthWithPaidDate.length > 0) {
      paidThisMonth = paidThisMonthWithPaidDate[0].total;
      paymentsProcessedCount = paidThisMonthWithPaidDate[0].count;
    } else {

      const paidThisMonthFallback = await Commission.aggregate([
        {
          $match: {
            status: 'Paid',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      paidThisMonth = paidThisMonthFallback[0]?.total || 0;
      paymentsProcessedCount = paidThisMonthFallback[0]?.count || 0;
    }

    if (paidThisMonth === 0) {
      const paymentRecordsThisMonth = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      paidThisMonth = paymentRecordsThisMonth[0]?.total || 0;
      paymentsProcessedCount = paymentRecordsThisMonth[0]?.count || 0;
    }

    const paymentRecordsThisMonth = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const finalPaidThisMonth = paidThisMonth > 0 ? paidThisMonth : (paymentRecordsThisMonth[0]?.total || 0);
    const finalPaymentsCount = paymentsProcessedCount > 0 ? paymentsProcessedCount : (paymentRecordsThisMonth[0]?.count || 0);

    const activeAgentsResult = await Commission.aggregate([
      { $group: { _id: '$agentId' } },
      { $count: 'activeAgents' }
    ]);
    const activeAgents = activeAgentsResult[0]?.activeAgents || 0;

    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const startOfLastMonth = new Date(lastMonthYear, lastMonth - 1, 1);
    const endOfLastMonth = new Date(lastMonthYear, lastMonth, 0, 23, 59, 59, 999);

    const lastMonthCommissionResult = await Commission.aggregate([
      {
        $match: {
          status: { $in: ['Approved', 'Paid'] },
          createdAt: {
            $gte: startOfLastMonth,
            $lte: endOfLastMonth
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthCommission = lastMonthCommissionResult[0]?.total || 0;

    const commissionGrowthPercent = lastMonthCommission > 0
      ? Math.round(((totalCommission - lastMonthCommission) / lastMonthCommission) * 100)
      : totalCommission > 0 ? 100 : 0;

    console.log('Dashboard Stats Debug:', {
      currentMonth,
      currentYear,
      startOfMonth,
      endOfMonth,
      paidThisMonth: finalPaidThisMonth,
      paymentsProcessedCount: finalPaymentsCount,
      totalCommission,
      pendingPayouts,
      activeAgents
    });

    res.json({
      totalCommission,
      pendingPayouts,
      pendingRequestsCount,
      pendingPayoutsCount,
      paidThisMonth: finalPaidThisMonth,
      paymentsProcessedCount: finalPaymentsCount,
      activeAgents,
      commissionGrowthPercent
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', country = '' } = req.query;

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

    if (country) {
      searchFilter.country = country;
    }

    const agents = await Agent.find(searchFilter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const agentsWithCommissions = await Promise.all(
      agents.map(async (agent) => {
        const totalCommissionResult = await Commission.aggregate([
          { $match: { agentId: agent._id, status: { $in: ['Approved', 'Paid'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalCommission = totalCommissionResult[0]?.total || 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const thisMonthResult = await Commission.aggregate([
          {
            $match: {
              agentId: agent._id,
              status: { $in: ['Approved', 'Paid'] },
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const thisMonth = thisMonthResult[0]?.total || 0;

        const pendingAmountResult = await Commission.aggregate([
          { $match: { agentId: agent._id, status: 'Approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingAmountResult[0]?.total || 0;
        const pendingRequests = await PaymentRequest.countDocuments({
          agentId: agent._id,
          status: 'Pending'
        });

        const applications = await Student.countDocuments({ agentId: agent._id });
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
          phone: agent.phone || '',
          country: agent.country || 'Not specified',
          totalCommission,
          thisMonth,
          pendingAmount,
          pendingRequests,
          applications,
          successful: successfulCount,
          status: agent.isActive !== false ? 'Active' : 'Inactive'
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

router.post('/create-sample-data', async (req, res) => {
  try {
    const now = new Date();
    const sampleCommissions = [
      {
        agentId: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        amount: 500,
        status: 'Paid',
        type: 'Application Fee',
        description: 'Sample commission 1',
        program: 'Computer Science',
        institute: 'Sample University',
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        paidDate: now,
        createdAt: now
      },
      {
        agentId: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        amount: 750,
        status: 'Paid',
        type: 'Application Fee',
        description: 'Sample commission 2',
        program: 'Business Administration',
        institute: 'Sample College',
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        paidDate: now,
        createdAt: now
      }
    ];

    await Commission.insertMany(sampleCommissions);
    res.json({ message: 'Sample data created successfully' });
  } catch (error) {
    console.error('Create sample data error:', error);
    res.status(500).json({ error: 'Failed to create sample data' });
  }
});

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

    if (status === 'Paid') {
      const payment = new Payment({
        agentId: paymentRequest.agentId._id,
        amount: paymentRequest.amount,
        method: 'Bank Transfer',
        transactionId: `TXN${Date.now()}`,
        status: 'completed',
        paymentDate: new Date()
      });
      await payment.save();
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

    const totalEarned = await Commission.aggregate([
      { $match: { agentId: new mongoose.Types.ObjectId(agentId), status: { $in: ['Approved', 'Paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingAmount = await Commission.aggregate([
      { $match: { agentId: new mongoose.Types.ObjectId(agentId), status: 'Approved' } },
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
      year: new Date().getFullYear(),
      status: 'Pending'
    });

    await commission.save();
    res.status(201).json({ message: 'Commission created successfully', commission });
  } catch (error) {
    console.error('Create commission error:', error);
    res.status(500).json({ error: 'Failed to create commission' });
  }
});

router.post('/auto-generate', async (req, res) => {
  try {
    const { studentId, applicationId } = req.body;

    const student = await Student.findById(studentId);
    if (!student || !student.agentId) {
      return res.status(400).json({ error: 'Student or agent not found' });
    }

    const application = student.applications.id(applicationId);
    if (!application) {
      return res.status(400).json({ error: 'Application not found' });
    }

    const existingCommission = await Commission.findOne({
      studentId,
      applicationId
    });

    if (existingCommission) {
      return res.status(400).json({ error: 'Commission already exists for this application' });
    }

    let commissionAmount = 500;
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
      year: new Date().getFullYear(),
      status: 'Approved'
    });

    await commission.save();
    res.status(201).json({ message: 'Commission auto-generated successfully', commission });
  } catch (error) {
    console.error('Auto-generate commission error:', error);
    res.status(500).json({ error: 'Failed to auto-generate commission' });
  }
});

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

router.post('/payment-request', async (req, res) => {
  try {
    const { agentId, amount, bankDetails, notes } = req.body;

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