const express = require("express");
const router = express.Router();
const { updateAgent } = require("../controllers/agent.controller");

router.patch("/update", updateAgent);

module.exports = router;
