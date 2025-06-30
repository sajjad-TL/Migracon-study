const University = require("../../models/SuperAdmin/University");
const Role = require("../../models/SuperAdmin/role");



const createUniversity = async (req, res) => {
  try {
    const { universityId, name, email, contactPerson, role } = req.body;
    
    // Generate university ID if not provided
    const uniId = universityId || `UNI${Date.now()}`;
    
    const uni = new University({ 
      universityId: uniId, 
      name, 
      email, 
      contactPerson, 
      role: role || "Viewer",
      status: "Pending"
    });
    
    await uni.save();
    res.status(201).json({ success: true, university: uni });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    const { name, email, contactPerson, role } = req.body;
    const updated = await University.findByIdAndUpdate(
      req.params.id, 
      { name, email, contactPerson, role },
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
