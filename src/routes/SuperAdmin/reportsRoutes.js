// src/routes/SuperAdmin/commission.js
const express = require("express");
const router = express.Router();
const { createReport , getReports, getReportTrends, exportExcelReport, regenerateReport } = require('../../controllers/SuperAdmin/reportController')

// GET /api/commission/dashboard/stats
router.get("/dashboard/stats", getDashboardStats);

<<<<<<< HEAD
router.post("/createReport", createReport);
=======
// GET /api/commission/agents
router.get("/agents", getAgents);
>>>>>>> 2f9e3af71c59c533213cfeee57cbef4ba2134a2c

// GET /api/reports?months=6
router.get("/getReport", getReports);
router.get('/trends', getReportTrends);
router.get('/exportExcel', exportExcelReport);
router.post('/regenerateReport', regenerateReport)

// GET /api/commission/export
router.get("/export", exportCommissionData);

module.exports = router;