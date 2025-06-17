const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200 // same as school name
  },
  level: {
    type: String,
    required: true,
    enum: ['Bachelor', 'Master', 'Diploma', 'Foundation']
  },
  field: {
    type: String,
    trim: true
  },
  duration: {
    type: String, // e.g. "3 Years", "1.5 Years"
    trim: true
  },
  tuitionFee: {
    type: Number,
    required: true
  },
  intakeMonths: [
    {
      type: String,
      enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
  ],
  description: {
    type: String,
    maxlength: 1000 // match with school description
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  }
}, {
  timestamps: true // to match schoolSchema
});

module.exports = mongoose.model("Program", programSchema);
