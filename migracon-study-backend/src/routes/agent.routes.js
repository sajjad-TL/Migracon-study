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
    const customName = `image_${
      req.body.agentId ? req.body.agentId : Date.now()
    }${path.extname(file.originalname)}`;
    return cb(null, customName);
  },
});

const upload = multer({ storage });

router.patch("/update", upload.single("profilePicture"), updateAgent);
router.get("/:agentId", getAgent);
router.get("/all-students/:agentId", allStudents);

module.exports = router;
