const School = require('../../models/SuperAdmin/school');

exports.createSchool = async (req, res) => {
  try {
    const {
      name,
      type,
      country,
      city,
      description
    } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newSchool = new School({
      name,
      type,
      country,
      city,
      description,
      image
    });

    await newSchool.save();

    res.status(201).json({ success: true, school: newSchool });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, schools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json({ success: true, school });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json({ success: true, school });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json({ success: true, message: "School deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchoolsWithStats = async (req, res) => {
  try {
    const stats = await School.getSchoolsWithStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find();
    res.status(200).json({ success: true, schools });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch schools', error: err.message });
  }
};
