const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const {
  createUniversity,
  getAllUniversities,
  getUniversityById,
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

router.post(
  "/create",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "accreditation", maxCount: 1 },
    { name: "registrationDocs", maxCount: 10 }
  ]),
  createUniversity
);

router.get("/all", getAllUniversities);
router.patch(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "accreditation", maxCount: 1 },
    { name: "registrationDocs", maxCount: 10 }
  ]),
  updateUniversity
);

router.patch("/:id/approve", approveUniversity);
router.patch("/:id/suspend", suspendUniversity);
router.delete("/:id", deleteUniversity);
router.get("/role-permissions", getRolePermissions);
router.get("/:id", getUniversityById);

router.get('/roles', getAllRoles);
router.post('/roles/create', createRole);
router.patch('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

module.exports = router;
