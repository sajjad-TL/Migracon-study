const mongoose = require('mongoose');

const studyProgramSchema = new mongoose.Schema({
  programName: { type: String, required: true, trim: true },
  programCode: { type: String, required: true, unique: true, trim: true },
  degreeLevel: { type: String, required: true, enum: ['bachelor', 'master', 'phd', 'diploma'] },
  department: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true, min: 1, max: 10 },
  studyMode: { type: String, required: true, enum: ['full-time', 'part-time', 'online', 'hybrid'] },
  language: { type: String, required: true, enum: ['english', 'spanish', 'french', 'german'] },
  campusLocation: { type: String, required: true, trim: true },
  maxStudents: { type: Number, min: 1 },
  specializations: [{ type: String, trim: true }],
  annualTuition: { type: Number, required: true, min: 0 },
  domesticTuition: { type: Number, min: 0 },
  applicationFee: { type: Number, required: true, min: 0 },
  additionalFees: { type: Number, min: 0, default: 0 },
  scholarships: { type: String },
  minimumGPA: { type: Number, required: true, min: 0, max: 4 },
  englishProficiency: { type: String, required: true, enum: ['toefl-80', 'ielts-6.5', 'native', 'other'] },
  previousEducation: { type: String, required: true, enum: ['high-school', 'bachelor', 'master', 'equivalent'] },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studyProgramSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudyProgram', studyProgramSchema);
