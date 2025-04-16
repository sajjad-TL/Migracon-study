const express = require("express");
const router = express.Router();
const { updateAgent, getAgent } = require("../controllers/agent.controller");

router.patch("/update", updateAgent);
router.get("/:agentId", getAgent);

module.exports = router;
