const express = require("express");
const router = express.Router();
const upload = require('../../middlewares/upload');

const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getAllApplications,
  getAllStudents,
  updateApplication,
  getLatestApplications,
  uploadDocument,
  deleteDocument
} = require("../../controllers/Agent/student.controller");

// Document routes - place these BEFORE the dynamic /:studentId route
router.post('/upload-document/:studentId', upload.single('file'), uploadDocument);
router.delete('/students/:studentId/documents/:filename', deleteDocument);

// Application routes
router.get("/getAllApplications", getAllApplications);
router.post('/:studentId/new-application', newApplication);
router.patch('/:studentId/update-application/:applicationId', updateApplication);
router.get("/latestApplications", getLatestApplications);

// Student routes
router.post("/add-new", addNewStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);
router.get("/getAllStudents", getAllStudents);

// This should be last as it's a catch-all route
router.get("/:studentId", getStudent);

module.exports = router;