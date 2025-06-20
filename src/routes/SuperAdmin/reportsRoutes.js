// src/routes/SuperAdmin/commission.js
const express = require("express");
const router = express.Router();
const { 
  getDashboardStats, 
  getAgents, 
  getPaidCommissions,
  exportCommissionData 
} = require('../../controllers/SuperAdmin/commissionController');

// GET /api/commission/dashboard/stats
router.get("/dashboard/stats", getDashboardStats);

// GET /api/commission/agents
router.get("/agents", getAgents);

// GET /api/commission/paid-commissions
router.get("/paid-commissions", getPaidCommissions);

// GET /api/commission/export
router.get("/export", exportCommissionData);

module.exports = router;