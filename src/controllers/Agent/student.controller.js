const Student = require("../../models/Agent/student.model");
const mongoose = require("mongoose");

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
    !conditionsAccepted ||
    !citizenOf
  ) {
    return res.status(400).json({
      message:
        "First name , last name, date of birth, passport number , passport expiry date , gender , email, phone number , citizenship  required and conditions must be accepted",
    });
  }
if (!agentId) {
    return res.status(400).json({
      message: "Agent ID is required",
    });
  }
  try {
    const existingStudent = await Student.findOne({
      $or: [{ email }, { passportNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
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
      agentId: objectIdAgentId, // Use the converted ObjectId
    });
    if (student) {
      return res.status(201).json({
        success: true,
        message: "Student created successfully",
        name: `${student.firstName} ${student.lastName}`,
        id: student._id,
                assignedAgent: agentId, // Return assigned agent ID for confirmation

      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, error: error });
  }
};

const getStudent = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.status(400).json({
      message: "Please provide student ID",
    });
  }

  try {
    const student = await Student.findOne({ _id: studentId });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }); // Most recent students first

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found",
      });
    }

    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Error fetching all students:", error);
    return res.status(502).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
};

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

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      student: deletedStudent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error deleting student",
      error: error.message,
    });
  }
};

const updateStudent = async (req, res) => {
  const { studentId, ...updatedValues } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updatedValues },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(410).json({ message: "Student not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({
      message: "Error updating student",
      error: error.message,
    });
  }
};





const newApplication = async (req, res) => {
  const studentId = req.params.studentId;
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
    !paymentDate ||
    !applyDate ||
    !program ||
    !institute ||
    !startDate ||
    !status ||
    !requirements ||
    !currentStage ||
    !requirementspartner
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const student = await Student.findById({ _id: studentId }).select("applications");

    if (!student) {
      return res.status(404).json({ message: "Student does not exist" });
    }

    const isDuplicate = student.applications.some((app) =>
      app.program === program &&
      app.institute === institute &&
      new Date(app.startDate).toISOString() === new Date(startDate).toISOString()
    );

    if (isDuplicate) {
      return res.status(409).json({ message: "Duplicate application detected" });
    }

    const generateApplicationId = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const newApp = {
      paymentDate,
      applicationId: generateApplicationId(),
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

    return res.status(200).json({ message: "New application added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error, error: error.message });
  }
};


const getAllApplications = async (req, res) => {
  try {
    const students = await Student.find().select("firstName lastName email applications");

    const allApplications = [];

    students.forEach((student) => {
      student.applications.forEach((app) => {
        allApplications.push({
          firstName: student.firstName,
          lastName: student.lastName,
          studentEmail: student.email,
          studentId: student._id,
          requirementspartner: app.requirementspartner,
          ...app.toObject(),
        });
      });
    });

    return res.status(200).json({
      success: true,
      applications: allApplications,
    });
  } catch (error) {
    console.error("Error fetching all applications:", error);
    return res.status(500).json({
      message: "Error fetching all applications",
      error: error.message,
    });
  }
};

module.exports = {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getAllApplications,
  getAllStudents
};
