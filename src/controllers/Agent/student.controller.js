const Student = require("../../models/Agent/student.model");
const mongoose = require("mongoose");
const Agent = require("../../models/Agent/agent.model");
const fs = require('fs');
const path = require('path');
const AgentNotification = require("./agentNotificationController"); // Adjust path as needed



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

// Add New Student with notification
const addNewStudent = async (req, res) => {
  const {
    firstName, lastName, middleName, citizenOf, dateOfBirth,
    passportNumber, passportExpiryDate, gender, email, phoneNumber,
    referralSource, status, countryOfInterest, serviceOfInterest,
    conditionsAccepted, agentId
  } = req.body;

  const io = req.app.get("io");

  if (!firstName || !lastName || !dateOfBirth || !passportNumber || !passportExpiryDate ||
    !gender || !email || !phoneNumber || !citizenOf) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Valid Agent ID is required" });
  }

  try {
    const existingStudent = await Student.findOne({ $or: [{ email }, { passportNumber }] });
    if (existingStudent) return res.status(400).json({ message: "Student already exists" });

    let profileImage = null;
    if (req.file) {
      profileImage = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date()
      };
    }

    const newStudent = new Student({
      firstName, lastName, middleName, citizenOf, dateOfBirth,
      passportNumber, passportExpiryDate, gender, email, phoneNumber,
      referralSource, status, countryOfInterest, serviceOfInterest,
      termsAccepted: conditionsAccepted || true,
      agentId, profileImage
    });

    await newStudent.save();

    // ✅ Create notification in database + real-time emit
    await createNotification(
      io,
      agentId,
      `New student ${firstName} ${lastName} has been added successfully.`,
      "Notes"
    );

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      studentId: newStudent._id,
      assignedAgent: agentId,
      profileImage
    });

  } catch (error) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => { });
    console.error("Error adding student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Student
const getStudent = async (req, res) => {
  const { studentId } = req.params;
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId))
    return res.status(400).json({ message: "Valid student ID is required" });

  try {
    const student = await Student.findById(studentId).populate("agentId");
    if (!student) return res.status(404).json({ message: "Student not found" });
    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get All Students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).populate("agentId");
    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: "No students found" });
    }
    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Error fetching all students:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Student
const deleteStudent = async (req, res) => {
  const { studentId } = req.body;
  const io = req.app.get("io");

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId))
    return res.status(400).json({ message: "Valid studentId is required" });

  try {
    const studentToDelete = await Student.findById(studentId);
    if (!studentToDelete) return res.status(404).json({ message: "Student not found" });

    // Delete files
    if (studentToDelete.profileImage?.path) {
      await fs.promises.unlink(studentToDelete.profileImage.path).catch(() => {});
    }
    for (const doc of studentToDelete.documents || []) {
      await fs.promises.unlink(doc.path).catch(() => {});
    }

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    io.emit("notification", {
      type: "student_deleted",
      message: `Student ${studentToDelete.firstName} ${studentToDelete.lastName} was deleted.`,
    });

    return res.status(200).json({ success: true, message: "Student deleted", student: deletedStudent });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Student
const updateStudent = async (req, res) => {
  const { studentId, ...updateData } = req.body;
  const io = req.app.get("io");
  console.log("👀 Emitting student_updated to all clients:", io.engine.clientsCount);

  // Validate studentId
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  // Convert conditionsAccepted to termsAccepted if it exists
  if (updateData.conditionsAccepted !== undefined) {
    updateData.termsAccepted = updateData.conditionsAccepted;
    delete updateData.conditionsAccepted;
  }

  // 🛡️ IMPORTANT: Prevent overwriting applications accidentally
  if ('applications' in updateData) {
    console.warn("⚠️ Attempt to update applications through updateStudent blocked.");
    delete updateData.applications;
  }

  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔔 Emit notification to connected clients
    setTimeout(() => {
      if (io.engine.clientsCount > 0) {
        io.emit("notification", {
          type: "student_updated",
          message: `Student ${updatedStudent.firstName} ${updatedStudent.lastName} was updated.`,
        });
        console.log(`🔔 Emitting 'student_updated' to ${io.engine.clientsCount} clients`);
      } else {
        console.log("⚠️ No clients connected, skipping emit");
      }
    }, 1000);

    return res.status(200).json({ success: true, message: "Student updated", student: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update Student Profile Image
const updateProfileImage = async (req, res) => {
  const { studentId } = req.params;
  const io = req.app.get("io");

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId))
    return res.status(400).json({ message: "Valid student ID is required" });

  if (!req.file) return res.status(400).json({ message: "No image file provided" });

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      await fs.promises.unlink(req.file.path);
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.profileImage?.path) {
      await fs.promises.unlink(student.profileImage.path).catch(() => {});
    }

    const newProfileImage = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date()
    };

    student.profileImage = newProfileImage;
    await student.save();

    io.emit("notification", {
      type: "student_updated",
      message: `Student ${student.firstName} ${student.lastName} profile image updated.`,
    });

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: newProfileImage
    });

  } catch (error) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    console.error("Error updating profile image:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Add New Application with notification
const newApplication = async (req, res) => {
  const { studentId } = req.params;
  const {
    paymentDate, applyDate, program, institute, startDate,
    status, requirements, currentStage, requirementspartner
  } = req.body;

  const io = req.app.get("io");

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  if (!paymentDate || !applyDate || !program || !institute || !startDate ||
    !status || !requirements || !currentStage || !requirementspartner) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isDuplicate = student.applications.some(app =>
      app.program === program &&
      app.institute === institute &&
      new Date(app.startDate).toISOString() === new Date(startDate).toISOString()
    );

    if (isDuplicate) {
      return res.status(409).json({ message: "Duplicate application detected" });
    }

    const newApp = {
      paymentDate,
      applicationId: Math.floor(100000 + Math.random() * 900000).toString(),
      applyDate,
      program,
      institute,
      startDate,
      status,
      requirements,
      currentStage,
      requirementspartner,
      createdAt: new Date()
    };

    student.applications.push(newApp);
    student.applicationCount = student.applications.length;
    await student.save();

    // ✅ Create notification in database + real-time emit
    await createNotification(
      io,
      student.agentId,
      `New application submitted by ${student.firstName} ${student.lastName} for ${program} at ${institute}.`,
      "Updates"
    );

    return res.status(200).json({ 
      success: true,
      message: "Application added successfully",
      applicationId: newApp.applicationId
    });

  } catch (error) {
    console.error("Error adding application:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update Application
const updateApplication = async (req, res) => {
  const { studentId, applicationId } = req.params;
  const updatedData = req.body;

  if (!studentId || !applicationId) {
    return res.status(400).json({ message: "Student ID and Application ID are required" });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const index = student.applications.findIndex(app => app.applicationId === applicationId);
    if (index === -1) return res.status(404).json({ message: "Application not found" });

    student.applications[index] = { ...student.applications[index]._doc, ...updatedData };
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Application updated",
      updatedApplication: student.applications[index],
    });

  } catch (error) {
    console.error("Error updating application:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getAllApplications = async (req, res) => {
  try {
    const students = await Student.find()
      .select("firstName lastName email phoneNumber dateOfBirth citizenOf applications agentId")
      .populate("agentId", "name")
      .lean();

    const allApplications = [];

    students.forEach(student => {
      student.applications.forEach(app => {
        allApplications.push({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber,
          dateOfBirth: student.dateOfBirth,
          citizenOf: student.citizenOf,
          agentName: student.agentId?.name || null,
          ...app,
        });
      });
    });

    return res.status(200).json({ success: true, applications: allApplications });

  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getLatestApplications = async (req, res) => {
  try {
    const students = await Student.find().select("firstName lastName email applications agentId").lean();

    let allApplications = [];

    students.forEach(student => {
      student.applications.forEach(app => {
        allApplications.push({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          agentId: student.agentId,
          createdAt: app.createdAt || new Date(),
          ...app,
        });
      });
    });

    // Sort by application.createdAt
    const latestApplications = allApplications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return res.status(200).json({ success: true, latestApplications });

  } catch (error) {
    console.error("Error fetching latest applications:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const documentMeta = {
      filename: String(file.filename),
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      size: file.size,
      uploadedAt: new Date()
    };

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $push: { documents: documentMeta } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      success: true,
      message: "File uploaded and saved to student record",
      document: documentMeta
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { studentId, filename } = req.params;
    console.log("DELETE request received for studentId:", studentId, "filename:", filename);

    // Validate studentId
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Valid student ID is required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    const document = student.documents.find(doc => doc.filename === filename);
    if (!document) {
      console.log("Document not found in student.documents");
      return res.status(404).json({ message: "Document not found" });
    }

    console.log("Document found:", document);

    // Remove document from student's documents array
    student.documents = student.documents.filter(doc => doc.filename !== filename);
    await student.save();

    const filePath = path.resolve(document.path);
    console.log("Attempting to delete file at:", filePath);

    // Use fs.promises for better async handling
    try {
      await fs.promises.unlink(filePath);
      console.log("File deleted successfully");
      
      return res.status(200).json({
        success: true,
        message: "Document deleted successfully"
      });
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Even if file deletion fails, we've already removed it from DB
      return res.status(200).json({
        success: true,
        message: "Document removed from database (file may not exist on disk)"
      });
    }

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
};

module.exports = {
  addNewStudent,
  getStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  updateProfileImage,
  newApplication,
  updateApplication,
  getAllApplications,
  getLatestApplications,
  uploadDocument,
  deleteDocument
};