const express = require("express");
const router = express.Router();
const {
  updateAgent,
  getAgent,
  allStudents,
  getAllAgents,
} = require("../../controllers/Agent/agent.controller");

const path = require("path");
const multer = require("multer");

// ✅ Corrected Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "profilePictures/"); // ✅ use cb properly with 3 arguments
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const customName = `${req.params.agentId ? req.params.agentId : Date.now()}_image${extension}`;
    cb(null, customName);
  }
});

const upload = multer({ storage });

router.patch("/update/:agentId", upload.single("profilePicture"), updateAgent);
router.get("/allagents/getAllAgents", getAllAgents); // ✅ New route
router.get("/all-students/:agentId", allStudents);
router.get("/:agentId", getAgent);

module.exports = router;
