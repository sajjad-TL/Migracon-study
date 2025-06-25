const Student = require("../../models/Agent/student.model");
const mongoose = require("mongoose");
const Agent = require("../../models/Agent/agent.model");
const fs = require('fs');
const path = require('path');

// Add New Student with optional image upload
const addNewStudent = async (req, res) => {
  const {
    firstName,
    lastName,
    middleName,
    citizenOf,
    dateOfBirth,
    passportNumber,
    passportExpiryDate,
    gender,
    email,
    phoneNumber,
    referralSource,
    status,
    countryOfInterest,
    serviceOfInterest,
    conditionsAccepted,
    agentId,
  } = req.body;

  if (
    !firstName || !lastName || !dateOfBirth || !passportNumber || !passportExpiryDate ||
    !gender || !email || !phoneNumber || !citizenOf
  ) {
    return res.status(400).json({
      message: "Missing required fields: first name, last name, date of birth, passport details, gender, email, phone number, citizenship."
    });
  }

  if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Valid Agent ID is required" });
  }

  try {
    const existingStudent = await Student.findOne({
      $or: [{ email }, { passportNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // Handle profile image upload
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
      firstName,
      lastName,
      middleName,
      citizenOf,
      dateOfBirth,
      passportNumber,
      passportExpiryDate,
      gender,
      email,
      phoneNumber,
      referralSource,
      status,
      countryOfInterest,
      serviceOfInterest,
      termsAccepted: conditionsAccepted || true,
      agentId,
      profileImage: profileImage
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      studentId: newStudent._id,
      assignedAgent: agentId,
      profileImage: profileImage
    });

  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    console.error("Error adding student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Student
const getStudent = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  try {
    const student = await Student.findById(studentId).populate("agentId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

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

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid studentId is required" });
  }

  try {
    const studentToDelete = await Student.findById(studentId);

    if (!studentToDelete) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete profile image if exists
    if (studentToDelete.profileImage && studentToDelete.profileImage.path) {
      try {
        await fs.promises.unlink(studentToDelete.profileImage.path);
      } catch (fileError) {
        console.error("Error deleting profile image:", fileError);
      }
    }

    // Delete all documents
    if (studentToDelete.documents && studentToDelete.documents.length > 0) {
      for (const doc of studentToDelete.documents) {
        try {
          await fs.promises.unlink(doc.path);
        } catch (fileError) {
          console.error("Error deleting document:", fileError);
        }
      }
    }

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    return res.status(200).json({ success: true, message: "Student deleted", student: deletedStudent });

  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Student
const updateStudent = async (req, res) => {
  const { studentId, ...updateData } = req.body;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  // Convert conditionsAccepted to termsAccepted if present
  if (updateData.conditionsAccepted !== undefined) {
    updateData.termsAccepted = updateData.conditionsAccepted;
    delete updateData.conditionsAccepted;
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

    return res.status(200).json({ success: true, message: "Student updated", student: updatedStudent });

  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Student Profile Image
const updateProfileImage = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  try {
    const student = await Student.findById(studentId);

    if (!student) {
      // Delete uploaded file if student not found
      await fs.promises.unlink(req.file.path);
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete old profile image if exists
    if (student.profileImage && student.profileImage.path) {
      try {
        await fs.promises.unlink(student.profileImage.path);
      } catch (fileError) {
        console.error("Error deleting old profile image:", fileError);
      }
    }

    // Update with new profile image
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

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: newProfileImage
    });

  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    console.error("Error updating profile image:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add New Application
const newApplication = async (req, res) => {
  const { studentId } = req.params;
  const {
    paymentDate, applyDate, program, institute, startDate,
    status, requirements, currentStage, requirementspartner
  } = req.body;

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

    return res.status(200).json({ message: "Application added successfully" });

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
    const students = await Student.find().select("firstName lastName email applications").lean();

    const allApplications = [];

    students.forEach(student => {
      student.applications.forEach(app => {
        allApplications.push({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
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