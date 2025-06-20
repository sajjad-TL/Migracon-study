// controllers/SuperAdmin/report.controller.js

const Report = require("../../models/SuperAdmin/Reports");
const Commission = require("../../models/SuperAdmin/Commission");
const Student = require("../../models/Agent/student.model");
const Agent = require("../../models/Agent/agent.model");
const ExcelJS = require('exceljs');

const getMonthString = (date) => date.toLocaleString('default', { month: 'short' });

const createReport = async (req, res) => {
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
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
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
    const { range } = req.query;

    const allReports = await Report.find({});

    const sortedReports = allReports.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateA - dateB; // ascending
    });

    let filteredReports = [];

    if (range === '1m') {
      const latest = sortedReports[sortedReports.length - 1];
      if (latest) filteredReports = [latest]; 
    } else {
      let monthsToSubtract = 6;
      if (range === '3m') monthsToSubtract = 3;

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToSubtract + 1, 1);

      filteredReports = sortedReports.filter(r => {
        const reportDate = new Date(`${r.month} 1, ${r.year}`);
        return reportDate >= startDate;
      });
    }

    res.status(200).json(filteredReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reports", error: err.message });
  }
};

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

const exportExcelReport = async (req, res) => {
  try {
    const { range } = req.query;

    const allReports = await Report.find({});

    const sortedReports = allReports.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateA - dateB;
    });

    let reportsToExport = [];

    if (range === '1m') {
      const latest = sortedReports[sortedReports.length - 1];
      if (latest) reportsToExport = [latest];
    } else {
      let monthsToSubtract = 6;
      if (range === '3m') monthsToSubtract = 3;

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToSubtract + 1, 1);

      reportsToExport = sortedReports.filter(r => {
        const reportDate = new Date(`${r.month} 1, ${r.year}`);
        return reportDate >= startDate;
      });
    }

    if (!reportsToExport.length) {
      return res.status(404).json({ message: "No report data found for export" });
    }

    const workbook = new ExcelJS.Workbook();

    for (const report of reportsToExport) {
      const worksheet = workbook.addWorksheet(`${report.month} ${report.year}`);

      worksheet.addRow(['Report Summary']);
      worksheet.addRow([]);

      worksheet.addRow([
        'Month',
        'Year',
        'Monthly Applications',
        'Monthly Revenue',
        'Active Agents',
        'Success Rate (%)',
        'Total Applications',
        'Approval Rate (%)',
        'Avg Processing Time (days)'
      ]);

      worksheet.addRow([
        report.month,
        report.year,
        report.monthlyApplications,
        report.monthlyRevenue,
        report.activeAgents,
        report.successRate,
        report.totalApplications,
        report.approvalRate,
        report.processingTimeDays
      ]);
      worksheet.addRow([]);

      worksheet.addRow(['Top Source Countries']);
      worksheet.addRow(['Country', 'Percentage (%)']);
      report.sourceCountries.forEach(c =>
        worksheet.addRow([c.country, c.percentage])
      );
      worksheet.addRow([]);

      worksheet.addRow(['Popular Programs']);
      worksheet.addRow(['Program', 'University', 'Applications']);
      report.popularPrograms.forEach(p =>
        worksheet.addRow([p.program, p.university, p.applications])
      );
      worksheet.addRow([]);

      worksheet.addRow(['Top Performing Agents']);
      worksheet.addRow(['Agent Name', 'Applications', 'Success Rate (%)']);
      report.topAgents.forEach(a =>
        worksheet.addRow([a.name, a.applications, a.successRate])
      );

      // Formatting
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.columns.forEach(col => {
        col.width = 25;
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_${range || 'all'}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export reports', error: err.message });
  }
};



module.exports = { createReport, getReports, getReportTrends, exportExcelReport };
