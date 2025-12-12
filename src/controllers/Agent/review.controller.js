const Student = require("../../models/Agent/student.model");
const Agent = require("../../models/Agent/agent.model");
const mongoose = require("mongoose");
const AgentNotification = require("../../models/Agent/AgentNotification");

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

// Helper function to determine document status
const getDocumentStatus = (documents) => {
  if (!documents || documents.length === 0) {
    return {
      status: 'Missing',
      count: 0,
      color: 'red'
    };
  }
  
  // Check if all required documents are present
  const requiredDocs = ['transcript', 'recommendation', 'statement', 'passport'];
  const presentDocs = documents.filter(doc => doc && doc.type).map(doc => doc.type);
  const missingDocs = requiredDocs.filter(doc => !presentDocs.includes(doc));
  
  if (missingDocs.length === 0) {
    return {
      status: 'Complete',
      count: documents.length,
      color: 'green'
    };
  } else {
    return {
      status: 'Incomplete',
      count: documents.length,
      missing: missingDocs,
      color: 'yellow'
    };
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
      // Handle different status variations
      if (status === 'Pending Review' || status === 'Pending') {
        matchConditions['applications.status'] = { $in: ['Pending', 'Pending Review', 'Submitted'] };
      } else if (status === 'Doc Requested') {
        matchConditions['applications.status'] = { $in: ['Doc Requested', 'Documents Required', 'Document Request'] };
      } else {
        matchConditions['applications.status'] = status;
      }
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
          { 'applications.institute': { $regex: search, $options: 'i' } },
          { 'applications.applicationId': { $regex: search, $options: 'i' } }
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
        $addFields: {
          // Calculate document status
          documentStatus: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$documents", []] } }, 0] },
              then: "Complete",
              else: "Missing"
            }
          },
          documentCount: { $size: { $ifNull: ["$documents", []] } }
        }
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
          documentStatus: 1,
          documentCount: 1,
          agent: { $arrayElemAt: ['$agent', 0] },
          // Map application data to match frontend expectations
          application: {
            applicationId: '$applications.applicationId',
            program: '$applications.program',
            degree: '$applications.degree',
            institute: '$applications.institute',
            status: '$applications.status',
            submissionDate: '$applications.applyDate',
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
      stats,
      filters: {
        statusOptions: [
          'All Status',
          'Pending Review',
          'Doc Requested', 
          'Approved',
          'Rejected',
          'In Progress',
          'Withdrawn'
        ],
        programOptions: [
          'All Programs',
          'Computer Science',
          'Engineering',
          'Business Administration',
          'Medicine',
          'Mathematics',
          'Physics',
          'Chemistry'
        ]
      }
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

// Get application statistics - Enhanced version
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

    // Get document statistics
    const docStats = await Student.aggregate([
      {
        $project: {
          hasDocuments: { $gt: [{ $size: { $ifNull: ["$documents", []] } }, 0] }
        }
      },
      {
        $group: {
          _id: '$hasDocuments',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const docStatsMap = docStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      pending: (statsMap['Pending'] || 0) + (statsMap['Pending Review'] || 0) + (statsMap['Submitted'] || 0),
      approved: (statsMap['Accepted'] || 0) + (statsMap['Approved'] || 0),
      rejected: statsMap['Rejected'] || 0,
      docRequested: (statsMap['Doc Requested'] || 0) + (statsMap['Documents Required'] || 0) + (statsMap['Document Request'] || 0),
      inProgress: statsMap['In Progress'] || 0,
      withdrawn: statsMap['Withdrawn'] || 0,
      // Additional stats
      documentsComplete: docStatsMap[true] || 0,
      documentsMissing: docStatsMap[false] || 0
    };

  } catch (error) {
    console.error("Error getting application stats:", error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      docRequested: 0,
      inProgress: 0,
      withdrawn: 0,
      documentsComplete: 0,
      documentsMissing: 0
    };
  }
};

// Update application status - Enhanced version
const updateApplicationStatus = async (req, res) => {
  const { studentId, applicationId } = req.params;
  const { status, notes, reason } = req.body;
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

  // Validate status
  const validStatuses = ['Pending', 'Pending Review', 'Approved', 'Rejected', 'Doc Requested', 'In Progress', 'Withdrawn'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status provided"
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
      (app) => app.applicationId === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    const oldStatus = student.applications[applicationIndex].status;
    
    // Update application status
    student.applications[applicationIndex].status = status;
    student.applications[applicationIndex].lastUpdated = new Date();

    if (notes) {
      student.applications[applicationIndex].notes = notes;
    }

    if (reason) {
      student.applications[applicationIndex].statusReason = reason;
    }

    // Add status history
    if (!student.applications[applicationIndex].statusHistory) {
      student.applications[applicationIndex].statusHistory = [];
    }

    student.applications[applicationIndex].statusHistory.push({
      status: status,
      previousStatus: oldStatus,
      changedAt: new Date(),
      notes: notes,
      reason: reason
    });

    await student.save();

    // Create notification
    const notificationMessage = `Application ${applicationId} status updated from ${oldStatus} to ${status} for ${student.firstName} ${student.lastName}`;
    await createNotification(
      io,
      student.agentId,
      notificationMessage,
      "Updates"
    );

    // Emit real-time update
    if (io) {
      io.emit("application_status_updated", {
        studentId,
        applicationId,
        status,
        oldStatus,
        studentName: `${student.firstName} ${student.lastName}`,
        timestamp: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application: student.applications[applicationIndex],
      oldStatus,
      newStatus: status
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

// Bulk update application status - Enhanced version
const bulkUpdateApplicationStatus = async (req, res) => {
  const { applicationIds, status, notes, reason } = req.body;
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

  // Validate status
  const validStatuses = ['Pending', 'Pending Review', 'Approved', 'Rejected', 'Doc Requested', 'In Progress', 'Withdrawn'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status provided"
    });
  }

  try {
    const updatePromises = applicationIds.map(async ({ studentId, applicationId }) => {
      try {
        const student = await Student.findById(studentId);
        if (!student) return { success: false, studentId, error: 'Student not found' };

        const applicationIndex = student.applications.findIndex(
          app => app.applicationId === applicationId
        );

        if (applicationIndex === -1) {
          return { success: false, studentId, applicationId, error: 'Application not found' };
        }

        const oldStatus = student.applications[applicationIndex].status;
        
        // Update application
        student.applications[applicationIndex].status = status;
        student.applications[applicationIndex].lastUpdated = new Date();
        
        if (notes) {
          student.applications[applicationIndex].notes = notes;
        }
        
        if (reason) {
          student.applications[applicationIndex].statusReason = reason;
        }

        // Add to status history
        if (!student.applications[applicationIndex].statusHistory) {
          student.applications[applicationIndex].statusHistory = [];
        }

        student.applications[applicationIndex].statusHistory.push({
          status: status,
          previousStatus: oldStatus,
          changedAt: new Date(),
          notes: notes,
          reason: reason,
          bulkUpdate: true
        });

        await student.save();

        // Create notification
        await createNotification(
          io,
          student.agentId,
          `Application ${applicationId} bulk updated to ${status} for ${student.firstName} ${student.lastName}`,
          "Updates"
        );

        return {
          success: true,
          studentId,
          applicationId,
          studentName: `${student.firstName} ${student.lastName}`,
          oldStatus,
          newStatus: status
        };
      } catch (error) {
        console.error(`Error updating application ${applicationId}:`, error);
        return { success: false, studentId, applicationId, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result.success);
    const failedUpdates = results.filter(result => !result.success);

    // Emit real-time update for successful updates
    if (io && successfulUpdates.length > 0) {
      io.emit("bulk_application_status_updated", {
        updates: successfulUpdates,
        status,
        timestamp: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: `${successfulUpdates.length} applications updated successfully`,
      updatedCount: successfulUpdates.length,
      failedCount: failedUpdates.length,
      totalRequested: applicationIds.length,
      successfulUpdates,
      failedUpdates: failedUpdates.length > 0 ? failedUpdates : undefined
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

// Get application details - Enhanced version
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

    // Get document status
    const documentStatus = getDocumentStatus(student.documents);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phoneNumber: student.phoneNumber,
          citizenOf: student.citizenOf,
          dateOfBirth: student.dateOfBirth,
          profileImage: student.profileImage,
          documents: student.documents,
          documentStatus,
          agent: student.agentId
        },
        application: {
          ...application,
          documentStatus
        }
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

// Export applications data - Enhanced version
const exportApplicationsData = async (req, res) => {
  try {
    const { format = 'json', status, program, institute, startDate, endDate } = req.query;

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
    if (startDate || endDate) {
      matchConditions['applications.applyDate'] = {};
      if (startDate) matchConditions['applications.applyDate'].$gte = new Date(startDate);
      if (endDate) matchConditions['applications.applyDate'].$lte = new Date(endDate);
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
        $addFields: {
          documentStatus: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$documents", []] } }, 0] },
              then: "Complete",
              else: "Missing"
            }
          },
          documentCount: { $size: { $ifNull: ["$documents", []] } }
        }
      },
      {
        $project: {
          studentName: { $concat: ['$firstName', ' ', '$lastName'] },
          email: 1,
          phoneNumber: 1,
          citizenOf: 1,
          dateOfBirth: 1,
          agentName: { 
            $concat: [
              { $arrayElemAt: ['$agent.firstName', 0] }, 
              ' ', 
              { $arrayElemAt: ['$agent.lastName', 0] }
            ] 
          },
          applicationId: '$applications.applicationId',
          program: '$applications.program',
          degree: '$applications.degree',
          institute: '$applications.institute',
          status: '$applications.status',
          applyDate: '$applications.applyDate',
          startDate: '$applications.startDate',
          currentStage: '$applications.currentStage',
          documentStatus: 1,
          documentCount: 1,
          notes: '$applications.notes'
        }
      },
      {
        $sort: { applyDate: -1 }
      }
    ];

    const applications = await Student.aggregate(pipeline);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Student Name,Email,Phone,Country,Date of Birth,Agent,Application ID,Program,Degree,Institute,Status,Apply Date,Start Date,Current Stage,Documents Status,Document Count,Notes\n';
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
          `"${app.degree || ''}"`,
          `"${app.institute || ''}"`,
          `"${app.status || ''}"`,
          `"${app.applyDate ? new Date(app.applyDate).toLocaleDateString() : ''}"`,
          `"${app.startDate ? new Date(app.startDate).toLocaleDateString() : ''}"`,
          `"${app.currentStage || ''}"`,
          `"${app.documentStatus || ''}"`,
          `"${app.documentCount || 0}"`,
          `"${app.notes ? app.notes.replace(/"/g, '""') : ''}"`
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
      exportedAt: new Date().toISOString(),
      filters: {
        status,
        program,
        institute,
        startDate,
        endDate
      }
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

// New endpoint: Request documents from student
const requestDocuments = async (req, res) => {
  const { studentId, applicationId } = req.params;
  const { documentTypes, message, dueDate } = req.body;
  const io = req.app.get("io");

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const applicationIndex = student.applications.findIndex(
      (app) => app.applicationId === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Update application status to "Doc Requested"
    student.applications[applicationIndex].status = "Doc Requested";
    student.applications[applicationIndex].lastUpdated = new Date();
    
    // Add document request details
    student.applications[applicationIndex].documentRequest = {
      requestedDocuments: documentTypes || [],
      message: message || "Please submit the following documents to complete your application.",
      requestedAt: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    await student.save();

    // Create notification
    await createNotification(
      io,
      student.agentId,
      `Documents requested for application ${applicationId} of ${student.firstName} ${student.lastName}`,
      "Document Request"
    );

    // Emit real-time update
    if (io) {
      io.emit("document_request_sent", {
        studentId,
        applicationId,
        studentName: `${student.firstName} ${student.lastName}`,
        documentTypes,
        dueDate
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document request sent successfully",
      application: student.applications[applicationIndex]
    });
  } catch (error) {
    console.error("Error requesting documents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// New endpoint: Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const stats = await getApplicationStats();
    
    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = await Student.aggregate([
      {
        $unwind: '$applications'
      },
      {
        $match: {
          'applications.applyDate': { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$applications.applyDate" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      stats,
      recentApplications,
      summary: {
        totalApplications: stats.total,
        pendingReview: stats.pending,
        approvedApplications: stats.approved,
        rejectedApplications: stats.rejected,
        documentsRequested: stats.docRequested,
        completionRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Error getting dashboard summary:", error);
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
  getApplicationStats,
  requestDocuments,
  getDashboardSummary
};