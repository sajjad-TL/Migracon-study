const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication
} = require("../controllers/student.controller");

router.post("/add-new", addNewStudent);
router.get("/:studentId", getStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);
router.post('/:studentId/new-application', newApplication)

module.exports = router;
