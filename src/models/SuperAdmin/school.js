const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['University', 'College', 'High School'],
    required: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  image: {
    type: String, // Path or URL to uploaded image
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("School", schoolSchema);
