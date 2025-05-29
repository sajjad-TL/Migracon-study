const Student = require("../../models/Agent/student.model");
const mongoose = require("mongoose");
const Agent = require("../../models/Agent/agent.model"); // Optional: only if you want to verify agent existence

// Add New Student
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
    !gender || !email || !phoneNumber || !conditionsAccepted || !citizenOf
  ) {
    return res.status(400).json({
      message: "Missing required fields: first name, last name, date of birth, passport details, gender, email, phone number, citizenship, and acceptance of conditions."
    });
  }

  if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Valid Agent ID is required" });
  }

  // Optional: Verify if Agent exists
  // const agentExists = await Agent.findById(agentId);
  // if (!agentExists) return res.status(404).json({ message: "Agent not found" });

  try {
    const existingStudent = await Student.findOne({
      $or: [{ email }, { passportNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
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
      conditionsAccepted,
      agentId,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      studentId: newStudent._id,
      assignedAgent: agentId,
    });

  } catch (error) {
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
    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

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

// Add New Application to Student
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

// Get All Applications
const getAllApplications = async (req, res) => {
  try {
    const students = await Student.find().select("firstName lastName email applications");

    const allApplications = [];

    students.forEach(student => {
      student.applications.forEach(app => {
        allApplications.push({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          ...app.toObject(),
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
    const students = await Student.find().select("firstName lastName email applications agent");

    let allApplications = [];

    students.forEach(student => {
      student.applications.forEach(app => {
        allApplications.push({
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          agent: student.agent, // assuming agent is stored in Student model
          ...app.toObject(),
        });
      });
    });

    // Sort applications by createdAt descending
    const latestApplications = allApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10); // latest 10

    return res.status(200).json({ success: true, latestApplications });

  } catch (error) {
    console.error("Error fetching latest applications:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};




module.exports = {
  addNewStudent,
  getStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  newApplication,
  updateApplication,
  getAllApplications,
  getLatestApplications
};
