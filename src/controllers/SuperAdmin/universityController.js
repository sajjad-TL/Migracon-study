const University = require("../../models/SuperAdmin/University");

const createUniversity = async (req, res) => {
  try {
    const { universityId, name, email, contactPerson, role } = req.body;
    const uni = new University({ universityId, name, email, contactPerson, role });
    await uni.save();
    res.status(201).json(uni);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllUniversities = async (req, res) => {
  try {
    const universities = await University.find().sort({ createdAt: -1 });
    res.json(universities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUniversity = async (req, res) => {
  try {
    const updated = await University.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveUniversity = async (req, res) => {
  try {
    const updated = await University.findByIdAndUpdate(req.params.id, { status: "Active" }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const suspendUniversity = async (req, res) => {
  try {
    const updated = await University.findByIdAndUpdate(req.params.id, { status: "Suspended" }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    await University.findByIdAndDelete(req.params.id);
    res.json({ message: "University deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const permissions = [
      {
        role: "Super Admin",
        access: "Full Access",
        permissions: ["Create University", "Edit University", "View Logs"],
      },
      {
        role: "University Admin",
        access: "Limited Access",
        permissions: ["Create Students", "Edit Students", "Delete Students"],
      },
      {
        role: "Viewer",
        access: "Limited Access",
        permissions: ["View Reports", "✗ Restricted Area"],
      },
    ];

    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  approveUniversity,
  suspendUniversity,
  deleteUniversity,
  getRolePermissions
};
