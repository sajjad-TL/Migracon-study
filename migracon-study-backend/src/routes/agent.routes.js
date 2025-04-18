const express = require("express");
const router = express.Router();
const {
  updateAgent,
  getAgent,
  allStudents,
} = require("../controllers/agent.controller");

const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "profilePictures/");
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname)
    const customName = `${
      // req.params.agentId }-${Date.now()}${path.extname(file.originalname)}`;
      req.params.agentId ? req.params.agentId : Date.now()
    }_image${extension}`;
    return cb(null, customName);
  },
});

const upload = multer({ storage });

router.patch("/update/:agentId", upload.single("profilePicture"), updateAgent);
router.get("/:agentId", getAgent);
router.get("/all-students/:agentId", allStudents);

module.exports = router;
