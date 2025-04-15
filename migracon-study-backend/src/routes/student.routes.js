const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  getAllStudents,
  updateStudent,
} = require("../controllers/student.controller");

router.post("/add-new", addNewStudent);
router.get("/get", getStudent);
router.delete("/delete", deleteStudent);
router.get("/all-students", getAllStudents);
router.patch("/update-student", updateStudent);

module.exports = router;
