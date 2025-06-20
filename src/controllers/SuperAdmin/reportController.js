const Commission = require("../../models/SuperAdmin/Commission");
const Agent = require("../../models/Agent/agent.model");
const Student = require("../../models/Agent/student.model");
const Agent = require("../../models/Agent/agent.model");
const ExcelJS = require('exceljs');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const month = getMonthString(currentDate);
    const year = currentDate.getFullYear();

    const startOfMonth = new Date(year, currentDate.getMonth(), 1);
    const endOfMonth = new Date(year, currentDate.getMonth() + 1, 0);

    const applicationsThisMonth = await Student.aggregate([
      { $unwind: "$applications" },
      {
        $match: {
          "applications.createdAt": {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      }
    ]);

    const monthlyApplications = applicationsThisMonth.length;

    const commissionsThisMonth = await Commission.find({
      month,
      year,
      status: 'Approved'
    });

    const monthlyRevenue = commissionsThisMonth.reduce((acc, c) => acc + c.amount, 0);
    const activeAgents = await Agent.countDocuments();

    const totalApplications = await Student.aggregate([{ $unwind: "$applications" }]);
    const approvedApplications = totalApplications.filter(app => app.applications.status === "Accepted");

    const dashboardStats = {
      totalCommission,
      pendingPayouts,
      pendingRequestsCount,
      paidThisMonth, // ✅ This will now show current month total
      paymentsProcessedCount,
      activeAgents,
      commissionGrowthPercent: parseFloat(commissionGrowthPercent)
    };

    console.log('Dashboard Stats:', dashboardStats);
    res.status(200).json(dashboardStats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics', 
      error: error.message 
    });
  }
};

// Get agents with commission data
const getAgents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', country = '' } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (country) {
      filter.country = country;
    }

    // Get agents with pagination
    const agents = await Agent.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('firstName lastName email country status createdAt');

    const totalAgents = await Agent.countDocuments(filter);
    const totalPages = Math.ceil(totalAgents / limit);

    // Get commission data for each agent
    const agentsWithCommissions = await Promise.all(
      agents.map(async (agent) => {
        // Total commission for this agent
        const totalCommissionResult = await Commission.aggregate([
          { $match: { agentId: agent._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalCommission = totalCommissionResult[0]?.total || 0;

        // This month commission
        const currentDate = new Date();
        const thisMonthCommissions = await Commission.find({
          agentId: agent._id,
          $expr: {
            $and: [
              { $eq: [{ $month: "$createdAt" }, currentDate.getMonth() + 1] },
              { $eq: [{ $year: "$createdAt" }, currentDate.getFullYear()] }
            ]
          }
        });
        const thisMonth = thisMonthCommissions.reduce((sum, comm) => sum + comm.amount, 0);

        // Pending amount
        const pendingCommissions = await Commission.find({
          agentId: agent._id,
          status: 'Pending'
        });
        const pendingAmount = pendingCommissions.reduce((sum, comm) => sum + comm.amount, 0);
        const pendingRequests = pendingCommissions.length;

        // Applications count
        const studentApplications = await Student.aggregate([
          { $match: { agentId: agent._id } },
          { $unwind: "$applications" },
          { $group: { 
            _id: null, 
            total: { $sum: 1 },
            successful: { 
              $sum: { 
                $cond: [{ $eq: ["$applications.status", "Accepted"] }, 1, 0] 
              }
            }
          }}
        ]);
        
        const applications = studentApplications[0]?.total || 0;
        const successful = studentApplications[0]?.successful || 0;

        return {
          id: agent._id,
          name: `${agent.firstName} ${agent.lastName}`,
          country: agent.country,
          totalCommission,
          thisMonth,
          pendingAmount,
          pendingRequests,
          applications,
          successful,
          status: agent.status
        };
      })
    );

    res.status(200).json({
      agents: agentsWithCommissions,
      totalAgents,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch agents', 
      error: error.message 
    });
  }
};

// Get paid commissions for specific month
const getPaidCommissions = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(6);
    res.status(200).json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reports", error: err.message });
  }
};

// (Optional) Trend data endpoint
const getReportTrends = async (req, res) => {
  try {
    const { type, agentId } = req.query;

    let data = [];
    
    if (type === 'commissions') {
      const filter = agentId ? { agentId } : {};
      
      const commissions = await Commission.find(filter)
        .populate('agentId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      data = commissions.map(comm => ({
        'Agent Name': comm.agentId ? `${comm.agentId.firstName} ${comm.agentId.lastName}` : 'N/A',
        'Agent Email': comm.agentId?.email || 'N/A',
        'Amount': comm.amount,
        'Status': comm.status,
        'Created Date': comm.createdAt.toISOString().split('T')[0],
        'Paid Date': comm.paidDate ? comm.paidDate.toISOString().split('T')[0] : 'N/A'
      }));
    }

    res.status(200).json({ data });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ 
      message: 'Failed to export data', 
      error: error.message 
    });
  }
};

module.exports = { createReport, getReports, getReportTrends };
