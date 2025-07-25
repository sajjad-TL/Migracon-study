// Extended Schema (models/SuperAdmin/University.js):
const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema({
  universityId: { type: String, unique: true },
  name: String,
  code: String,
  website: String,
  establishedYear: String,
  type: { type: String, enum: ["Public", "Private"] },
  accreditationStatus: { type: String, enum: ["Accredited", "Pending", "Not Accredited"] },

  country: String,
  state: String,
  city: String,
  postalCode: String,
  address: String,

  mainPhone: String,
  admissionsPhone: String,
  mainEmail: String,
  admissionsEmail: String,

  adminFirstName: String,
  adminLastName: String,
  adminJobTitle: String,
  adminDepartment: String,
  adminEmail: String,
  adminPhone: String,
  adminUsername: String,
  adminPassword: String,

  logoUrl: String,
  accreditationCertificateUrl: String,
  registrationDocumentsUrls: [String],

  acceptedTerms: Boolean,
  acceptedPrivacy: Boolean,
  acceptedCompliance: Boolean,

  role: {
    type: String,
    enum: ["University Admin", "Super Admin", "Viewer"],
    default: "Viewer"
  },
  lastLogin: Date,
  status: {
    type: String,
    enum: ["Active", "Pending", "Suspended", "Draft"],
    default: "Pending"
  },


   programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyProgram' }]
   
}, { timestamps: true });

module.exports = mongoose.model("University", universitySchema);