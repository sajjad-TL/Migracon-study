const Student = require("../../models/Agent/student.model");
const Agent = require("../../models/Agent/agent.model");
const mongoose = require("mongoose");
const AgentNotification = require("../../models/Agent/AgentNotification"); // Fixed import path

// Helper function to create notification
const createNotification = async (io, userId, message, type) => {
  try {
    const notification = new AgentNotification({
      userId,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();

    // Emit via Socket.IO
    if (io) {
      io.emit("notification", {
        _id: notification._id,
        userId,
        message,
        type,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Get all applications for review with student details
const getApplicationsForReview = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      program, 
      institute,
      startDate,
      endDate,
      search 
    } = req.query;

    const skip = (page - 1) * limit;
    let matchConditions = {};

    // Build filter conditions
    if (status && status !== 'All Status') {
      matchConditions['applications.status'] = status;
    }
    if (program && program !== 'All Programs') {
      matchConditions['applications.program'] = { $regex: program, $options: 'i' };
    }
    if (institute) {
      matchConditions['applications.institute'] = { $regex: institute, $options: 'i' };
    }
    if (startDate || endDate) {
      matchConditions['applications.applyDate'] = {};
      if (startDate) matchConditions['applications.applyDate'].$gte = new Date(startDate);
      if (endDate) matchConditions['applications.applyDate'].$lte = new Date(endDate);
    }

    // Add search functionality
    let searchConditions = {};
    if (search) {
      searchConditions = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'applications.program': { $regex: search, $options: 'i' } },
          { 'applications.institute': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Aggregation pipeline to flatten applications with student data
    const pipeline = [
      {
        $lookup: {
          from: 'agents',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$applications'
      },
      {
        $match: { ...matchConditions, ...searchConditions }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phoneNumber: 1,
          citizenOf: 1,
          dateOfBirth: 1,
          profileImage: 1,
          documents: 1,
          agent: { $arrayElemAt: ['$agent', 0] },
          // Map application data to match frontend expectations
          application: {
            applicationId: '$applications.applicationId',
            program: '$applications.program',
            degree: '$applications.degree',
            institute: '$applications.institute',
            status: '$applications.status',
            submissionDate: '$applications.applyDate', // Map applyDate to submissionDate
            applyDate: '$applications.applyDate',
            startDate: '$applications.startDate',
            currentStage: '$applications.currentStage',
            notes: '$applications.notes',
            lastUpdated: '$applications.lastUpdated'
          },
          // Add mapped fields for frontend compatibility
          personalInfo: {
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            email: '$email',
            phone: '$phoneNumber'
          },
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          program: '$applications.program',
          degree: '$applications.degree',
          status: '$applications.status'
        }
      },
      {
        $sort: { 'application.applyDate': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const applications = await Student.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      {
        $unwind: '$applications'
      },
      {
        $match: { ...matchConditions, ...searchConditions }
      },
      {
        $count: 'total'
      }
    ];

    const countResult = await Student.aggregate(countPipeline);
    const totalApplications = countResult[0]?.total || 0;

    // Get statistics
    const stats = await getApplicationStats();

    return res.status(200).json({
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalApplications / limit),
        totalApplications,
        hasNext: skip + applications.length < totalApplications,
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error("Error fetching applications for review:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get application statistics
const getApplicationStats = async () => {
  try {
    const stats = await Student.aggregate([
      {
        $unwind: '$applications'
      },
      {
        $group: {
          _id: '$applications.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      pending: statsMap['Pending'] || 0,
      approved: (statsMap['Accepted'] || 0) + (statsMap['Approved'] || 0),
      rejected: statsMap['Rejected'] || 0,
      inProgress: statsMap['In Progress'] || 0,
      withdrawn: statsMap['Withdrawn'] || 0
    };

  } catch (error) {
    console.error("Error getting application stats:", error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      inProgress: 0,
      withdrawn: 0
    };
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  const { studentId, applicationId } = req.params;
  const { status, notes } = req.body;
  const io = req.app.get("io");

  if (!studentId || !applicationId) {
    return res.status(400).json({ 
      success: false, 
      message: "Student ID and Application ID are required" 
    });
  }

  if (!status) {
    return res.status(400).json({ 
      success: false, 
      message: "Status is required" 
    });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    const applicationIndex = student.applications.findIndex(
      app => app.applicationId === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }

    const oldStatus = student.applications[applicationIndex].status;
    student.applications[applicationIndex].status = status;
    student.applications[applicationIndex].lastUpdated = new Date();

    if (notes) {
      student.applications[applicationIndex].notes = notes;
    }

    await student.save();

    // Create notification
    await createNotification(
      io,
      student.agentId,
      `Application status updated from ${oldStatus} to ${status} for ${student.firstName} ${student.lastName}`,
      "Updates"
    );

    // Emit real-time update
    if (io) {
      io.emit("application_status_updated", {
        studentId,
        applicationId,
        status,
        studentName: `${student.firstName} ${student.lastName}`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application: student.applications[applicationIndex]
    });

  } catch (error) {
    console.error("Error updating application status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Bulk update application status
const bulkUpdateApplicationStatus = async (req, res) => {
  const { applicationIds, status } = req.body;
  const io = req.app.get("io");

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Application IDs array is required" 
    });
  }

  if (!status) {
    return res.status(400).json({ 
      success: false, 
      message: "Status is required" 
    });
  }

  try {
    const updatePromises = applicationIds.map(async ({ studentId, applicationId }) => {
      const student = await Student.findById(studentId);
      if (!student) return null;

      const applicationIndex = student.applications.findIndex(
        app => app.applicationId === applicationId
      );

      if (applicationIndex === -1) return null;

      student.applications[applicationIndex].status = status;
      student.applications[applicationIndex].lastUpdated = new Date();
      await student.save();

      // Create notification
      await createNotification(
        io,
        student.agentId,
        `Application status bulk updated to ${status} for ${student.firstName} ${student.lastName}`,
        "Updates"
      );

      return {
        studentId,
        applicationId,
        studentName: `${student.firstName} ${student.lastName}`
      };
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    // Emit real-time update
    if (io) {
      io.emit("bulk_application_status_updated", {
        updates: successfulUpdates,
        status
      });
    }

    return res.status(200).json({
      success: true,
      message: `${successfulUpdates.length} applications updated successfully`,
      updatedCount: successfulUpdates.length,
      totalRequested: applicationIds.length
    });

  } catch (error) {
    console.error("Error bulk updating application status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get application details
const getApplicationDetails = async (req, res) => {
  const { studentId, applicationId } = req.params;

  if (!studentId || !applicationId) {
    return res.status(400).json({ 
      success: false, 
      message: "Student ID and Application ID are required" 
    });
  }

  try {
    const student = await Student.findById(studentId)
      .populate('agentId', 'firstName lastName email phone')
      .lean();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    const application = student.applications.find(
      app => app.applicationId === applicationId
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber,
          citizenOf: student.citizenOf,
          dateOfBirth: student.dateOfBirth,
          profileImage: student.profileImage,
          documents: student.documents,
          agent: student.agentId
        },
        application
      }
    });

  } catch (error) {
    console.error("Error fetching application details:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Export applications data
const exportApplicationsData = async (req, res) => {
  try {
    const { format = 'json', status, program, institute } = req.query;

    let matchConditions = {};
    if (status && status !== 'All Status') {
      matchConditions['applications.status'] = status;
    }
    if (program && program !== 'All Programs') {
      matchConditions['applications.program'] = { $regex: program, $options: 'i' };
    }
    if (institute) {
      matchConditions['applications.institute'] = { $regex: institute, $options: 'i' };
    }

    const pipeline = [
      {
        $lookup: {
          from: 'agents',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$applications'
      },
      {
        $match: matchConditions
      },
      {
        $project: {
          studentName: { $concat: ['$firstName', ' ', '$lastName'] },
          email: 1,
          phoneNumber: 1,
          citizenOf: 1,
          dateOfBirth: 1,
          agentName: { $concat: [{ $arrayElemAt: ['$agent.firstName', 0] }, ' ', { $arrayElemAt: ['$agent.lastName', 0] }] },
          applicationId: '$applications.applicationId',
          program: '$applications.program',
          institute: '$applications.institute',
          status: '$applications.status',
          applyDate: '$applications.applyDate',
          startDate: '$applications.startDate',
          currentStage: '$applications.currentStage'
        }
      },
      {
        $sort: { applyDate: -1 }
      }
    ];

    const applications = await Student.aggregate(pipeline);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Student Name,Email,Phone,Country,Date of Birth,Agent,Application ID,Program,Institute,Status,Apply Date,Start Date,Current Stage\n';
      const csvData = applications.map(app => {
        return [
          `"${app.studentName || ''}"`,
          `"${app.email || ''}"`,
          `"${app.phoneNumber || ''}"`,
          `"${app.citizenOf || ''}"`,
          `"${app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString() : ''}"`,
          `"${app.agentName || ''}"`,
          `"${app.applicationId || ''}"`,
          `"${app.program || ''}"`,
          `"${app.institute || ''}"`,
          `"${app.status || ''}"`,
          `"${app.applyDate ? new Date(app.applyDate).toLocaleDateString() : ''}"`,
          `"${app.startDate ? new Date(app.startDate).toLocaleDateString() : ''}"`,
          `"${app.currentStage || ''}"`
        ].join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvHeader + csvData);
    }

    return res.status(200).json({
      success: true,
      data: applications,
      count: applications.length,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error exporting applications data:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

module.exports = {
  getApplicationsForReview,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails,
  exportApplicationsData,
  getApplicationStats
};