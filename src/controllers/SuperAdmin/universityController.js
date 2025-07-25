const University = require("../../models/SuperAdmin/University");
const Role = require("../../models/SuperAdmin/role");



const createUniversity = async (req, res) => {
  try {
    const isDraft = req.query.draft === "true"; // 👈 check if it's a draft save

    const {
      name,
      code,
      website,
      establishedYear,
      type,
      accreditationStatus,

      country,
      state,
      city,
      postalCode,
      address,

      mainPhone,
      admissionsPhone,
      mainEmail,
      admissionsEmail,

      adminFirstName,
      adminLastName,
      adminJobTitle,
      adminDepartment,
      adminEmail,
      adminPhone,
      adminUsername,
      adminPassword,

      acceptedTerms,
      acceptedPrivacy,
      acceptedCompliance,
      role
    } = req.body;

    const universityId = `UNI${Date.now()}`;

    const newUniversity = new University({
      universityId,
      name,
      code,
      website,
      establishedYear,
      type,
      accreditationStatus,

      country,
      state,
      city,
      postalCode,
      address,

      mainPhone,
      admissionsPhone,
      mainEmail,
      admissionsEmail,

      adminFirstName,
      adminLastName,
      adminJobTitle,
      adminDepartment,
      adminEmail,
      adminPhone,
      adminUsername,
      adminPassword,

      acceptedTerms: acceptedTerms === "true",
      acceptedPrivacy: acceptedPrivacy === "true",
      acceptedCompliance: acceptedCompliance === "true",

      role: role || "Viewer",
      status: isDraft ? "Draft" : "Pending", // 👈 set status conditionally

      logoUrl: req.files?.logo?.[0]?.filename || "",
      accreditationCertificateUrl: req.files?.accreditation?.[0]?.filename || "",
      registrationDocumentsUrls: req.files?.registrationDocs?.map(file => file.filename) || []
    });

    await newUniversity.save();

    res.status(201).json({
      success: true,
      message: isDraft
        ? "University saved as draft successfully"
        : "University created successfully",
      university: newUniversity
    });
  } catch (error) {
    console.error("Create university error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllUniversities = async (req, res) => {
  try {
    const universities = await University.find()
      .populate('programs') // ✅ Populate linked programs
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      universities
    });
  } catch (err) {
    console.error('Error fetching universities:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch universities',
      error: err.message
    });
  }
};

const getUniversityById = async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ success: false, error: "University not found" });
    }
    res.json({ success: true, university });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateUniversity = async (req, res) => {
  try {
    const universityId = req.params.id;

    const updateData = {
      name: req.body.name,
      code: req.body.code,
      website: req.body.website,
      establishedYear: req.body.establishedYear,
      type: req.body.type,
      accreditationStatus: req.body.accreditationStatus,

      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      postalCode: req.body.postalCode,
      address: req.body.address,

      mainPhone: req.body.mainPhone,
      admissionsPhone: req.body.admissionsPhone,
      mainEmail: req.body.mainEmail,
      admissionsEmail: req.body.admissionsEmail,

      adminFirstName: req.body.adminFirstName,
      adminLastName: req.body.adminLastName,
      adminJobTitle: req.body.adminJobTitle,
      adminDepartment: req.body.adminDepartment,
      adminEmail: req.body.adminEmail,
      adminPhone: req.body.adminPhone,
      adminUsername: req.body.adminUsername,
      adminPassword: req.body.adminPassword,

      acceptedTerms: req.body.acceptedTerms === "true",
      acceptedPrivacy: req.body.acceptedPrivacy === "true",
      acceptedCompliance: req.body.acceptedCompliance === "true",

      role: req.body.role || "Viewer"
    };

    // 🖼 Handle uploaded files (if present)
    if (req.files?.logo?.[0]) {
      updateData.logoUrl = req.files.logo[0].filename;
    }
    if (req.files?.accreditation?.[0]) {
      updateData.accreditationCertificateUrl = req.files.accreditation[0].filename;
    }
    if (req.files?.registrationDocs?.length > 0) {
      updateData.registrationDocumentsUrls = req.files.registrationDocs.map(file => file.filename);
    }

    const updatedUniversity = await University.findByIdAndUpdate(
      universityId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUniversity) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "University updated successfully",
      university: updatedUniversity
    });
  } catch (error) {
    console.error("Update university error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update university"
    });
  }
};


const approveUniversity = async (req, res) => {
  try {
    const updated = await University.findByIdAndUpdate(
      req.params.id, 
      { status: "Active" }, 
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ success: false, error: "University not found" });
    }
    
    res.json({ success: true, university: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const suspendUniversity = async (req, res) => {
  try {
    const updated = await University.findByIdAndUpdate(
      req.params.id, 
      { status: "Suspended" }, 
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ success: false, error: "University not found" });
    }
    
    res.json({ success: true, university: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    const deleted = await University.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: "University not found" });
    }
    
    res.json({ success: true, message: "University deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



// Role Management
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles'
    });
  }
};


const createRole = async (req, res) => {
  try {
    const roleData = req.body;
    
    if (!roleData.name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const role = new Role({
      ...roleData,
      createdBy: req.user?.name || 'System Admin'
    });
    
    await role.save();

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create role'
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const role = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role'
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role deactivated successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate role'
    });
  }
};




// Role Permissions
const getRolePermissions = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true }).lean();

    const formattedRoles = roles.map(role => {
      const permissions = role.permissions || {};
      const permissionKeys = Object.keys(permissions);
      const enabledPermissions = permissionKeys.filter(key => permissions[key]);
      
      // Determine access level
      let access = 'Limited Access';
      if (enabledPermissions.length === permissionKeys.length && permissionKeys.length > 0) {
        access = 'Full Access';
      } else if (enabledPermissions.length === 0) {
        access = 'No Access';
      }

      // Format permission names
      const formattedPermissions = permissionKeys.map(key => {
        const formattedName = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        
        return formattedName;
      });

      return {
        role: role.name,
        access,
        permissions: formattedPermissions
      };
    });

    res.status(200).json({ 
      success: true, 
      data: formattedRoles 
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch role permissions' 
    });
  }
};


module.exports = {
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
  updateRole,
  deleteRole
};
