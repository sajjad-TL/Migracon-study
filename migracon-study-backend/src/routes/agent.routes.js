const express = require("express");
const router = express.Router();
const {
  updateAgent,
  getAgent,
  allStudents,
} = require("../controllers/agent.controller")


router.patch("/update", updateAgent);
router.get("/:agentId", getAgent);
router.get("/all-students/:agentId",  allStudents);

module.exports = router;
