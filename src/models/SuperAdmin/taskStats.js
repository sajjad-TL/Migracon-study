const mongoose = require("mongoose");

const taskStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  urgentTasks: Number,
  pendingTasks: Number,
  inProgressTasks: Number,
  completedTasks: Number,
  dueTasks: Number,
  activeAgents: Number,
  monthlyCompleted: Number
}, { timestamps: true });

module.exports = mongoose.model("TaskStats", taskStatsSchema);
