const { Task, TaskStats } = require('../../models/SuperAdmin/Task');
const { Application } = require('../../models/Agent/student.model');
const Agent = require('../../models/Agent/agent.model');

console.log('Task model:', Task);
console.log('TaskStats model:', TaskStats);
console.log('Agent model:', Agent);

exports.getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      type,
      search,
      fromDate,
      toDate
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { applicant: { $regex: search, $options: 'i' } },
        { application: { $regex: search, $options: 'i' } }
      ];
    }
    if (fromDate || toDate) {
      filter.dueDate = {};
      if (fromDate) filter.dueDate.$gte = new Date(fromDate);
      if (toDate) filter.dueDate.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

exports.createTask = async (req, res) => {
  console.log('Received Task Payload:', req.body);

  try {
    const task = new Task(req.body);
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('❌ Task creation failed:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Task ID' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Safe update of agent workload
    if (task.assignedTo) {
      try {
        const agentUpdate = await Agent.findOneAndUpdate(
          { name: task.assignedTo },
          { $inc: { currentWorkload: -1 } },
          { new: true }
        );

        if (!agentUpdate) {
          console.warn("⚠️ Agent not found:", task.assignedTo);
        }
      } catch (err) {
        console.error("⚠️ Error updating agent workload:", err.message);
      }
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error("❌ deleteTask failed:", error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { message, author, avatar, type = 'update' } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            message,
            author,
            avatar,
            type,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Note added successfully',
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
};

exports.updateRequirements = async (req, res) => {
  try {
    const { requirements } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { requirements },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Requirements updated successfully',
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating requirements',
      error: error.message
    });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    console.log("📊 getTaskStats API hit");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await TaskStats.findOne({ date: today });
    console.log("✅ Stats found for today?", !!stats);

    if (!stats) {

      const urgentTasks = await Task.countDocuments({ priority: 'High' });
      const pendingTasks = await Task.countDocuments({ status: 'Pending' });
      const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
      const completedTasks = await Task.countDocuments({ status: 'Completed' });

      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() + 7);
      const dueTasks = await Task.countDocuments({
        dueDate: { $lte: thisWeek },
        status: { $ne: 'Completed' }
      });

      const activeAgents = await Agent.countDocuments({
        isActive: true,
        currentWorkload: { $gt: 0 }
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyCompleted = await Task.countDocuments({
        status: 'Completed',
        updatedAt: { $gte: thisMonth }
      });

      const newStats = {
        urgentTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        dueTasks,
        activeAgents,
        monthlyCompleted
      };

      console.log("📈 Calculated new stats:", newStats);

      return res.json({
        success: true,
        data: newStats
      });
    } else {
      return res.json({
        success: true,
        data: stats
      });
    }
  } catch (error) {
    console.error("❌ Error in getTaskStats:", error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching task statistics',
      error: error.message
    });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { student: { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } },
        { program: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const application = new Application(req.body);
    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  }
};

exports.getAllAgents = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const agents = await Agent.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agents',
      error: error.message
    });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent',
      error: error.message
    });
  }
};

exports.createAgent = async (req, res) => {
  try {
    const agent = new Agent(req.body);
    await agent.save();

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating agent',
      error: error.message
    });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating agent',
      error: error.message
    });
  }
};