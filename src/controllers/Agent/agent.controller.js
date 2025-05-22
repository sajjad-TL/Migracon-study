const Agent = require("../../models/Agent/agent.model");
const mongoose = require("mongoose");
const Student = require("../../models/Agent/student.model");

const updateAgent = async (req, res) => {
  let { ...updatedValues } = req.body;
  const agentId = req.params.agentId
  if (!agentId || !updatedValues) {
    return res
      .status(400)
      .json({ message: "Agent ID and update values are required." });
  }

  try {
    if (req.file) {
      const fullUrl = `http://localhost:5000/${req.file.path.replace(/\\/g, "/")}`;
      updatedValues = { ...updatedValues, profilePicture: fullUrl };
    }


    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      { $set: updatedValues },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedAgent) {
      return res.status(404).json({ message: "Agent not found." });
    }

    const { _id, ...restObj } = updatedAgent
    return res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      updatedFields: Object.keys(updatedValues),
      agent: {
        agentId: _id,
        ...restObj
      },
    });
  } catch (error) {
    console.log("Error updating agent:", error);
    return res.status(500).json({
      message: "Error updating agent. Please try again later.",
      error: error.message,
    });
  }
};
const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 }).lean();

    if (!agents || agents.length === 0) {
      return res.status(404).json({ success: false, message: "No agents found." });
    }

    // Format response: optionally remove sensitive fields like password
    const formattedAgents = agents.map(({ password, resetPasswordToken, resetPasswordExpires, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      message: "Agents fetched successfully.",
      agents: formattedAgents,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching agents.",
      error: error.message,
    });
  }
};
const getAgent = async (req, res) => {
  const { agentId } = req.params;

  if (!agentId) {
    return res.status(400).json({ message: "Agent ID is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Invalid agent ID format" });
  }

  try {
    const existingAgent = await Agent.findById(agentId).lean();

    if (!existingAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const { _id, ...restObj } = existingAgent
    return res.status(200).json({
      message: "Success",
      agent: {
        agentId: _id,
        ...restObj
      }
    });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

// Modified allStudents function for agent.controller.js

const allStudents = async (req, res) => {
  const { agentId } = req.params;
  
  // Validate agentId format
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Invalid agent ID format" });
  }
  
  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent does not exist." });
    }

    // Convert agentId to MongoDB ObjectId to ensure proper matching
    const objectIdAgentId = new mongoose.Types.ObjectId(agentId);
    
    // Query students with the converted ObjectId
    const allStudents = await Student.find({ agentId: objectIdAgentId });

    res.status(200).json({
      message: "Students fetched successfully",
      students: allStudents,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
};
module.exports = {
  updateAgent,
  getAgent,
  allStudents,
  getAllAgents
};
