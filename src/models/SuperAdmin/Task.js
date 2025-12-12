// models/Task.js
const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'review', 'missing'],
    default: 'pending'
  },
  required: {
    type: Boolean,
    default: false
  }
});

const noteSchema = new mongoose.Schema({
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['update', 'closure', 'info'],
    default: 'update'
  },
  timestamp: { type: Date, default: Date.now }
});


const studentInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  program: {
    type: String,
    required: true
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  application: {
    type: String,
    required: true
  },
  applicant: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Review Required'],
    default: 'Pending'
  },
  avatar: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["documents", "review", "verification", "refund"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  studentInfo: studentInfoSchema,
  requirements: [requirementSchema],
  notes: [noteSchema]
}, {
  timestamps: true
});

// models/Application.js
const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: String,
    required: true
  },
  program: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Ready to Submit', 'Application Withdrawn', 'Under Review', 'Approved', 'Rejected'],
    default: 'Under Review'
  },
  intake: {
    type: String,
    required: true
  },
  internalId: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// models/Agent.js
const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentWorkload: {
    type: Number,
    default: 0
  },
  maxWorkload: {
    type: Number,
    default: 20
  }
}, {
  timestamps: true
});

// models/TaskStats.js
const taskStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  urgentTasks: {
    type: Number,
    default: 0
  },
  pendingTasks: {
    type: Number,
    default: 0
  },
  inProgressTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  urgentTasksChange: {
    type: Number,
    default: 0
  },
  dueTasks: {
    type: Number,
    default: 0
  },
  activeAgents: {
    type: Number,
    default: 0
  },
  monthlyCompleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});



module.exports = {
  Task: mongoose.model('Task', taskSchema),
  TaskStats: mongoose.model('TaskStats', taskStatsSchema)
};