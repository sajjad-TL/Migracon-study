const express = require("express");
const router = express.Router();

const {
  getApplicationsForReview,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails,
  exportApplicationsData,
  getApplicationStats
} = require("../../controllers/Agent/review.controller");

// Get all applications for review with filtering and pagination
router.get("/applications", getApplicationsForReview);

// Get application statistics
router.get("/stats", getApplicationStats);

// Get specific application details
router.get("/applications/:studentId/:applicationId", getApplicationDetails);

// Update single application status
router.patch("/applications/:studentId/:applicationId/status", updateApplicationStatus);

// Bulk update application status
router.patch("/applications/bulk-update", bulkUpdateApplicationStatus);

// Export applications data
router.get("/export", exportApplicationsData);

module.exports = router;