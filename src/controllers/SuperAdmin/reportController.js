// controllers/SuperAdmin/report.controller.js

const Report = require("../../models/SuperAdmin/Reports");
const Commission = require("../../models/SuperAdmin/Commission");
const Student = require("../../models/Agent/student.model");
const Agent = require("../../models/Agent/agent.model");

const getMonthString = (date) => date.toLocaleString('default', { month: 'short' });

const createReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const month = getMonthString(currentDate);
    const year = currentDate.getFullYear();

    const applicationsThisMonth = await Student.aggregate([
      { $unwind: "$applications" },
      {
        $match: {
          "applications.createdAt": {
            $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            $lte: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
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

    const successRate = totalApplications.length > 0
      ? ((approvedApplications.length / totalApplications.length) * 100).toFixed(1)
      : 0;

    const processingTimes = applicationsThisMonth
      .filter(app => app.applications.paymentDate && app.applications.applyDate)
      .map(app => {
        const applyDate = new Date(app.applications.applyDate);
        const payDate = new Date(app.applications.paymentDate);
        return (payDate - applyDate) / (1000 * 60 * 60 * 24);
      });

    const processingTimeDays = processingTimes.length
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    const countryStats = await Student.aggregate([
      { $group: { _id: "$citizenOf", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const totalStudents = await Student.countDocuments();

    const sourceCountries = countryStats.map(c => ({
      country: c._id,
      percentage: Math.round((c.count / totalStudents) * 100)
    }));

    const programStats = await Student.aggregate([
      { $unwind: "$applications" },
      {
        $group: {
          _id: {
            program: "$applications.program",
            institute: "$applications.institute"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 2 }
    ]);

    const popularPrograms = programStats.map(p => ({
      program: p._id.program,
      university: p._id.institute,
      applications: p.count
    }));

    const agentStats = await Student.aggregate([
      { $unwind: "$applications" },
      {
        $lookup: {
          from: "agents",
          localField: "agentId",
          foreignField: "_id",
          as: "agent"
        }
      },
      { $unwind: "$agent" },
      {
        $group: {
          _id: {
            agentId: "$agent._id",
            name: { $concat: ["$agent.firstName", " ", "$agent.lastName"] }
          },
          applications: { $sum: 1 },
          accepted: {
            $sum: {
              $cond: [{ $eq: ["$applications.status", "Accepted"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { applications: -1 } },
      { $limit: 2 }
    ]);

    const topAgents = agentStats.map(a => ({
      name: a._id.name,
      applications: a.applications,
      successRate: a.applications > 0 ? Math.round((a.accepted / a.applications) * 100) : 0,
      avatar: ""
    }));

    const report = new Report({
      month,
      year,
      monthlyApplications,
      monthlyRevenue,
      activeAgents,
      successRate,
      chartValue: monthlyApplications,
      totalApplications: totalApplications.length,
      approvalRate: successRate,
      processingTimeDays,
      sourceCountries,
      popularPrograms,
      topAgents
    });

    await report.save();
    res.status(201).json({ message: "Report generated and saved", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating report", error: err.message });
  }
};

const getReports = async (req, res) => {
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
    const reports = await Report.find().sort({ createdAt: -1 }).limit(6);
    const trends = reports.reverse().map(r => ({
      name: `${r.month} ${r.year}`,
      value: r.chartValue
    }));
    res.status(200).json(trends);
  } catch (err) {
    res.status(500).json({ message: "Error fetching trends", error: err.message });
  }
};

module.exports = { createReport, getReports, getReportTrends };
