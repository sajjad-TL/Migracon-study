const express = require("express");
const router = express.Router();
const {
  updateAgent,
  getAgent,
  allStudents,
  getAllAgents,
  getTopAgents,
  uploadDocument,
  deleteDocument 
} = require("../../controllers/Agent/agent.controller");

const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "profilePictures/");
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const customName = `${req.params.agentId ? req.params.agentId : Date.now()}_image${extension}`;
    cb(null, customName);
  }
});

const upload = multer({ storage });

router.patch("/update/:agentId", upload.single("profilePicture"), updateAgent);
router.get("/allagents/getAllAgents", getAllAgents);
router.get("/top-agents", getTopAgents);
router.get("/all-students/:agentId", allStudents);
router.get("/:agentId", getAgent);
router.post('/upload-document/:agentId', upload.single('file'), uploadDocument);
router.delete("/agents/:agentId/documents/:filename", deleteDocument);

module.exports = router;
