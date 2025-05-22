const Student = require("../../models/Agent/student.model");
const mongoose = require("mongoose");

// Add a new student
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
    !firstName ||
    !lastName ||
    !dateOfBirth ||
    !passportNumber ||
    !passportExpiryDate ||
    !gender ||
    !email ||
    !phoneNumber ||
    !citizenOf ||
    !conditionsAccepted
  ) {
    return res.status(400).json({
      message:
        "Missing required fields: first name, last name, DOB, passport number, expiry date, gender, email, phone number, citizenship, and conditions acceptance.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(new mongoose.Types.ObjectId(agentId))) {
    return res.status(400).json({ message: "Valid Agent ID is required" });
  }

  try {
    const existing = await Student.findOne({
      $or: [{ email }, { passportNumber }],
    });

    if (existing) {
      return res.status(409).json({ message: "Student already exists" });
    }

    const student = await Student.create({
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
      agentId: new mongoose.Types.ObjectId(agentId),
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
    });
  } catch (error) {
    console.error("Add student error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a student by ID
const getStudent = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all students
const getAllStudents = async (_req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }
    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Get all students error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a student
const deleteStudent = async (req, res) => {
  const { studentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID required" });
  }

  try {
    const deleted = await Student.findByIdAndDelete(studentId);
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json({ success: true, message: "Student deleted", student: deleted });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a student
const updateStudent = async (req, res) => {
  const { studentId, ...update } = req.body;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Valid student ID required" });
  }

  try {
    const updated = await Student.findByIdAndUpdate(studentId, { $set: update }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json({ success: true, message: "Student updated", student: updated });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add new application to a student
const newApplication = async (req, res) => {
  const { studentId } = req.params;
  const {
    paymentDate,
    applyDate,
    program,
    institute,
    startDate,
    status,
    requirements,
    requirementspartner,
    currentStage,
  } = req.body;

  if (
    !paymentDate || !applyDate || !program || !institute ||
    !startDate || !status || !requirements || !requirementspartner || !currentStage
  ) {
    return res.status(400).json({ message: "All application fields are required" });
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

    const generateApplicationId = () => Math.floor(100000 + Math.random() * 900000).toString();

    const newApp = {
      applicationId: generateApplicationId(),
      paymentDate,
      applyDate,
      program,
      institute,
      startDate,
      status,
      requirements,
      requirementspartner,
      currentStage,
    };

    student.applications.push(newApp);
    student.applicationCount = student.applications.length;
    await student.save();

    return res.status(200).json({ success: true, message: "Application added" });
  } catch (error) {
    console.error("Add application error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update application
const updateApplication = async (req, res) => {
  const { studentId, applicationId } = req.params;
  const updatedApp = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const index = student.applications.findIndex(app => app.applicationId === applicationId);
    if (index === -1) {
      return res.status(404).json({ message: "Application not found" });
    }

    student.applications[index] = {
      ...student.applications[index]._doc,
      ...updatedApp,
    };

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Application updated",
      application: student.applications[index],
    });
  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all applications across students
const getAllApplications = async (_req, res) => {
  try {
    const students = await Student.find().select("firstName lastName email applications");

    const applications = students.flatMap(student =>
      student.applications.map(app => ({
        ...app.toObject(),
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.email,
      }))
    );

    return res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error("Fetch applications error:", error);
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
};
