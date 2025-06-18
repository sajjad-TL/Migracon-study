const express = require("express");
const router = express.Router();
// const reportController = require("../../controllers/SuperAdmin/reportController");
const { createReport , getReports, getReportTrends } = require('../../controllers/SuperAdmin/reportController')


// POST /api/reports
router.post("/createReport", createReport);

// GET /api/reports?months=6
router.get("/getReport", getReports);
router.get('/trends', getReportTrends);

module.exports = router;
