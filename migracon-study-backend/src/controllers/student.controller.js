const Student = require("../models/student.model");
const mongoose = require("mongoose");
const Agent = require("../models/agent.model");

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
      agentId,
    });
    if (student) {
      return res.status(201).json({
        success: true,
        message: "Student created successfully",
        name: `${student.firstName} ${student.lastName}`,
        id: student._id,
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
      return res.status(404).json({ message: "Student not found" });
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

module.exports = {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
};
