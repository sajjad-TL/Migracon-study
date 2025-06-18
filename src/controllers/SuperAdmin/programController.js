const Program = require("../../models/SuperAdmin/program");

// Create
exports.createProgram = async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).json({ success: true, program });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find().populate('school');
    res.status(200).json({ success: true, programs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get One
exports.getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('school');
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.status(200).json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.status(200).json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.status(200).json({ success: true, message: "Program deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
