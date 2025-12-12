const User = require('../../models/SuperAdmin/user.model');
const University = require('../../models/SuperAdmin/University');

const createUser = async (req, res) => {
  try {
    console.log('📥 Incoming createUser payload:', JSON.stringify(req.body, null, 2));

    const {
      university,
      fullName,
      jobTitle,
      emailAddress,
      phoneNumber,
      department,
      secondaryEmail,
      username,
      password,
      role,
      permissions,
      accountStatus,
      accountExpiryDate,
      emailNotifications,
      forcePasswordChange
    } = req.body;

    if (!university?.name || !university?.code) {
      return res.status(400).json({ message: 'University name and code are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ emailAddress }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already exists.' });
    }

    let existingUniversity = await University.findOne({
      name: university.name,
      code: university.code
    });

    if (!existingUniversity) {
      const generatedUniversityId = `UNI${Date.now()}`;

      try {
        existingUniversity = new University({
          universityId: generatedUniversityId,
          name: university.name,
          code: university.code,
          country: university.country || '',
          city: university.city || '',
          website: university.website || '',
          status: 'Draft'
        });

        await existingUniversity.save();
        console.log('✅ New university created:', existingUniversity._id);
      } catch (uniErr) {
        console.error('❌ Failed to create university:', uniErr);
        return res.status(500).json({
          message: 'Failed to create university',
          error: uniErr.message
        });
      }
    }

    const user = new User({
      universityId: existingUniversity._id,
      fullName,
      jobTitle,
      emailAddress,
      phoneNumber,
      department,
      secondaryEmail,
      username,
      password,
      role,
      permissions,
      accountStatus,
      accountExpiryDate,
      emailNotifications,
      forcePasswordChange
    });

    await user.save();
    console.log('✅ User created:', user._id);

    res.status(201).json({ message: 'User created successfully', user });

  } catch (error) {
    console.error('🔥 Create User Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('universityId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('universityId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

const updateUserById = async (req, res) => {
  try {
    const {
      universityId,
      fullName,
      jobTitle,
      emailAddress,
      phoneNumber,
      department,
      secondaryEmail,
      username,
      password,
      role,
      permissions,
      accountStatus,
      accountExpiryDate,
      emailNotifications,
      forcePasswordChange
    } = req.body;

    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { $or: [{ emailAddress }, { username }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or Username already exists.'
      });
    }

    const updateData = {
      universityId,
      fullName,
      jobTitle,
      emailAddress,
      phoneNumber,
      department,
      secondaryEmail,
      username,
      role,
      permissions,
      accountStatus,
      accountExpiryDate,
      emailNotifications,
      forcePasswordChange
    };

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('universityId');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

const getUsersWithPagination = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      role = ''
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All Status') {
      query.accountStatus = status;
    }

    if (role && role !== 'All Roles') {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .populate('universityId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        usersPerPage: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users with pagination:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updateData } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid user IDs'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData,
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ success: false, message: 'Failed to update users' });
  }
};

const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid user IDs'
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ success: false, message: 'Failed to delete users' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserById,
  getUsersWithPagination,
  bulkUpdateUsers,
  bulkDeleteUsers
};