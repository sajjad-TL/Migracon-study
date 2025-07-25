const StudyProgram = require('../../models/SuperAdmin/StudyProgram');
const University = require('../../models/SuperAdmin/University'); //

// Create Study Program
const createProgram = async (req, res) => {
  try {
    const programData = req.body;

    // Step 1: Create the study program
    const program = new StudyProgram(programData);
    await program.save();

    // Step 2: Try to find a matching university using campusLocation
    const university = await University.findOne({
      $or: [
        { name: { $regex: programData.campusLocation, $options: 'i' } },
        { city: { $regex: programData.campusLocation, $options: 'i' } }
      ]
    });

    // Step 3: If a match is found, push the program ID to the university's programs
    if (university) {
      university.programs = university.programs || [];
      university.programs.push(program._id);
      await university.save();
      console.log(`📌 Linked program to university: ${university.name}`);
    } else {
      console.log('⚠️ No matching university found for campus location:', programData.campusLocation);
    }

    res.status(201).json({ success: true, message: 'Program created', program });

  } catch (error) {
    console.error('Create Program Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get All
const getAllPrograms = async (req, res) => {
  try {
    const programs = await StudyProgram.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, programs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch programs' });
  }
};

// Get One
const getProgramById = async (req, res) => {
  try {
    const program = await StudyProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, program });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch program' });
  }
};

// Delete
const deleteProgramById = async (req, res) => {
  try {
    const deleted = await StudyProgram.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

// Update
const updateProgramById = async (req, res) => {
  try {
    const updated = await StudyProgram.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Updated', program: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update', error: error.message });
  }
};

module.exports = {
  createProgram,
  getAllPrograms,
  getProgramById,
  deleteProgramById,
  updateProgramById
};
