const Agent = require("../models/agent.model");
const mongoose = require("mongoose");
const Student = require("../models/student.model");

const updateAgent = async (req, res) => {
  let { ...updatedValues } = req.body;
  const agentId = req.params.agentId
  console.log('Agent id: ', agentId)
  console.log('Values: ', updatedValues)
  if ( !agentId || !updatedValues) {
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

    const { _id , ...restObj } = updatedAgent
    return res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      updatedFields: Object.keys(updatedValues),
      agent: {
        agentId : _id,
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

    const { _id , ...restObj } = existingAgent
    return res.status(200).json({
      message: "Success",
      agent : {
        agentId : _id,
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

const allStudents = async (req, res) => {
  const { agentId } = req.params;
  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent does not exist." });
    }

    const allStudents = await Student.find({ agentId });

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
};
