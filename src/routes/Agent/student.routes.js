const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getAllApplications,

} = require("../../controllers/Agent/student.controller");

router.get("/getAllApplications", getAllApplications);
router.post("/add-new", addNewStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);

router.post('/:studentId/new-application', newApplication);
router.get("/:studentId", getStudent);

module.exports = router;