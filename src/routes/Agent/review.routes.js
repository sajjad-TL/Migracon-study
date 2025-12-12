const express = require('express');
const router = express.Router();
const {
  getApplicationsForReview,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails,
  exportApplicationsData,
  getApplicationStats,
  requestDocuments,
  getDashboardSummary
} = require('../../controllers/Agent/review.controller');


router.get('/applications', getApplicationsForReview);
router.get('/stats', getApplicationStats);
router.get('/dashboard', getDashboardSummary);
router.get('/applications/:studentId/:applicationId', getApplicationDetails);
router.patch('/applications/:studentId/:applicationId/status', updateApplicationStatus);
router.patch('/applications/bulk-update', bulkUpdateApplicationStatus);
router.post('/applications/:studentId/:applicationId/request-documents', requestDocuments);
router.get('/export', exportApplicationsData);

module.exports = router;