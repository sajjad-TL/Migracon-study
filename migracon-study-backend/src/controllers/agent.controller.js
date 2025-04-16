const Agent = require("../models/agent.model");

const updateAgent = async (req, res) => {
  const { agentId, ...updatedValues } = req.body;

  if (!agentId || !updatedValues) {
    return res
      .status(400)
      .json({ message: "Agent id and values to be updated are required." });
  }

  try {
    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      { $set: updatedValues },
      { new: true, runValidators: true }
    );

    if (!updatedAgent) {
      return res.stauts(404).json({ message: "Agent not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      agent: updatedAgent,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error updating agent. Try again later",
      error: error.message,
    });
  }
};

module.exports = {
  updateAgent,
};
