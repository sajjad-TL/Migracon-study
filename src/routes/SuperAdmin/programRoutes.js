const express = require("express");
const router = express.Router();
const programController = require("../../controllers/SuperAdmin/programController");

// Routes
router.post("/create", programController.createProgram);
router.get("/all", programController.getAllPrograms);
router.get("/:id", programController.getProgramById);
router.patch("/:id", programController.updateProgram);
router.delete("/:id", programController.deleteProgram);

module.exports = router;
