// models/Report.js
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "Jan"
  year: { type: Number, required: true }, // optional
  monthlyApplications: { type: Number, default: 0 },
  monthlyRevenue: { type: Number, default: 0 },
  activeAgents: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 }, // %
  chartValue: { type: Number, default: 0 }, // For bar chart

  totalApplications: { type: Number, default: 0 },
  approvalRate: { type: Number, default: 0 },
  processingTimeDays: { type: Number, default: 0 },

  sourceCountries: [
    {
      country: String,
      percentage: Number,
    },
  ],

  popularPrograms: [
    {
      program: String,
      university: String,
      applications: Number,
    },
  ],

  topAgents: [
    {
      name: String,
      applications: Number,
      successRate: Number,
      avatar: String, // optional
    },
  ],
});

module.exports = mongoose.model("Report", ReportSchema);
