const express = require("express");
const router = express.Router();
const {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  approveUniversity,
  suspendUniversity,
  deleteUniversity,
  getRolePermissions,
  getAllRoles,
  createRole,
  deleteRole,
  updateRole
} = require("../../controllers/SuperAdmin/universityController");

router.post("/create", createUniversity);
router.get("/all", getAllUniversities);
router.patch("/:id", updateUniversity);
router.patch("/:id/approve", approveUniversity);
router.patch("/:id/suspend", suspendUniversity);
router.delete("/:id", deleteUniversity);
router.get("/role-permissions", getRolePermissions);

router.get('/roles', getAllRoles);
router.post('/roles/create', createRole);
router.patch('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

module.exports = router;
