const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getApplications
} = require("../controllers/student.controller");

router.post("/add-new", addNewStudent);
router.get("/:studentId", getStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);
router.post('/:studentId/new-application', newApplication);
router.get("/:studentId/getApplications", getApplications);


module.exports = router;
