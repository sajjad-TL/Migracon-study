const express = require("express");
const router = express.Router();
const {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  approveUniversity,
  suspendUniversity,
  deleteUniversity,
  getRolePermissions
} = require("../../controllers/SuperAdmin/universityController");

router.post("/create", createUniversity);
router.get("/all", getAllUniversities);
router.patch("/:id", updateUniversity);
router.patch("/:id/approve", approveUniversity);
router.patch("/:id/suspend", suspendUniversity);
router.delete("/:id", deleteUniversity);
router.get("/role-permissions", getRolePermissions);

module.exports = router;
