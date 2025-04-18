const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
} = require("../controllers/student.controller");

router.post("/add-new", addNewStudent);
router.get("/:studentId", getStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);

module.exports = router;
