// src/routes/SuperAdmin/commission.js
const express = require("express");
const router = express.Router();
// const reportController = require("../../controllers/SuperAdmin/reportController");
const { createReport , getReports, getReportTrends, exportExcelReport } = require('../../controllers/SuperAdmin/reportController')

// GET /api/commission/dashboard/stats
router.get("/dashboard/stats", getDashboardStats);

// GET /api/commission/agents
router.get("/agents", getAgents);

// GET /api/reports?months=6
router.get("/getReport", getReports);
router.get('/trends', getReportTrends);
router.get('/exportExcel', exportExcelReport);

// GET /api/commission/export
router.get("/export", exportCommissionData);

module.exports = router;