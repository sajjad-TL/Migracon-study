const Agent = require("../../models/Agent/agent.model");
const mongoose = require("mongoose");
const Student = require("../../models/Agent/student.model");

// ✅ Add these imports
const fs = require("fs");
const path = require("path");

const updateAgent = async (req, res) => {
  let { ...updatedValues } = req.body;
  const agentId = req.params.agentId;
  if (!agentId || !updatedValues) {
    return res.status(400).json({ message: "Agent ID and update values are required." });
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

    const { _id, ...restObj } = updatedAgent;
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

    const { _id, ...restObj } = existingAgent;
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

const allStudents = async (req, res) => {
  const { agentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    return res.status(400).json({ message: "Invalid agent ID format" });
  }

  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent does not exist." });
    }
    const objectIdAgentId = new mongoose.Types.ObjectId(agentId);
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

const getTopAgents = async (req, res) => {
  try {
    const agents = await Agent.find().lean();

    if (!agents || agents.length === 0) {
      return res.status(404).json({ success: false, message: "No agents found." });
    }

    const agentsWithApplications = await Promise.all(
      agents.map(async (agent) => {
        const students = await Student.find({ agentId: agent._id }).lean();

        let totalApplications = 0;
        let acceptedApplications = 0;

        students.forEach(student => {
          if (student.applications && student.applications.length > 0) {
            totalApplications += student.applications.length;

            const accepted = student.applications.filter(app => app.status === "Accepted").length;
            acceptedApplications += accepted;
          }
        });

        const successRate = totalApplications > 0
          ? Math.round((acceptedApplications / totalApplications) * 100)
          : 0;

        const totalRevenue = acceptedApplications * 2000;

        return {
          agentId: agent._id,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          profilePicture: agent.profilePicture,
          totalApplications,
          acceptedApplications,
          successRate,
          totalRevenue,
          studentsCount: students.length
        };
      })
    );

    const sortedAgents = agentsWithApplications
      .sort((a, b) => b.totalApplications - a.totalApplications)
      .slice(0, 2);

    return res.status(200).json({
      success: true,
      message: "Top agents fetched successfully.",
      topAgents: sortedAgents,
    });

  } catch (error) {
    console.error("Error fetching top agents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching top agents.",
      error: error.message,
    });
  }
};

const uploadDocument = async (req, res) => {
  const { agentId } = req.params;
  const { title } = req.body;

  if (!req.file || !title) {
    return res.status(400).json({ message: "Title and file are required." });
  }

  try {
    const fileUrl = `http://localhost:5000/${req.file.path.replace(/\\/g, "/")}`;
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found." });
    }

    agent.documents.push({
      title,
      fileUrl,
      verified: false, 
      uploadedAt: new Date()
    });

    await agent.save();

    res.status(200).json({
      message: "Document uploaded successfully.",
      document: agent.documents.slice(-1)[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while uploading document." });
  }
};


const deleteDocument = async (req, res) => {
  const { agentId, filename } = req.params;

  if (!agentId || !filename) {
    return res.status(400).json({ message: "Agent ID and filename are required." });
  }

  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found." });
    }

    const documentIndex = agent.documents.findIndex(doc => doc.fileUrl.includes(filename));
    if (documentIndex === -1) {
      return res.status(404).json({ message: "Document not found in agent records." });
    }

    const filePath = path.join(__dirname, "../../public/profilePictures", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.warn("File not found on disk:", filePath);
    }

    agent.documents.splice(documentIndex, 1);
    await agent.save();

    return res.status(200).json({ success: true, message: "Document deleted successfully." });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ success: false, message: "Server error while deleting document." });
  }
};

module.exports = {
  updateAgent,
  getAgent,
  allStudents,
  getAllAgents,
  getTopAgents,
  uploadDocument,
  deleteDocument
};
