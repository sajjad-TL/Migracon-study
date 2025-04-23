const express = require("express");
const router = express.Router();
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getApplications,
  getAllApplications
} = require("../controllers/student.controller");

router.get("/getAllApplications", getAllApplications);
router.post("/add-new", addNewStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);

// 👇 move this after all static routes
router.get("/:studentId/getApplications", getApplications);
router.post('/:studentId/new-application', newApplication);
router.get("/:studentId", getStudent); // 👈 keep this at the very end


module.exports = router;
