const express = require("express");
const router = express.Router();
const { createReport , getReports, getReportTrends, exportExcelReport, regenerateReport } = require('../../controllers/SuperAdmin/reportController')


router.post("/createReport", createReport);

// GET /api/reports?months=6
router.get("/getReport", getReports);
router.get('/trends', getReportTrends);
router.get('/exportExcel', exportExcelReport);
router.post('/regenerateReport', regenerateReport)

module.exports = router;
