// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/SuperAdmin/taskController');
const {
  createTask,
  getAllTasks,
  getTaskStats,
  getTaskById,
  updateTask,
  deleteTask,
  addNote,
  updateRequirements

} = require("../../controllers/SuperAdmin/taskController");


// Task CRUD operations
router.get('/', getAllTasks);
router.get('/stats', getTaskStats);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.post('/:id/notes', addNote);
router.put('/:id/requirements', updateRequirements);

module.exports = router;

// // routes/applicationRoutes.js
// const express = require('express');
// const router = express.Router();
// const applicationController = require('../controllers/applicationController');

// // Application CRUD operations
// router.get('/', applicationController.getAllApplications);
// router.get('/:id', applicationController.getApplicationById);
// router.post('/', applicationController.createApplication);

// module.exports = router;

// // routes/agentRoutes.js
// const express = require('express');
// const router = express.Router();
// const agentController = require('../controllers/agentController');

// // Agent CRUD operations
// router.get('/', agentController.getAllAgents);
// router.get('/:id', agentController.getAgentById);
// router.post('/', agentController.createAgent);
// router.put('/:id', agentController.updateAgent);

// module.exports = router;

// // routes/index.js
// const express = require('express');
// const router = express.Router();

// const taskRoutes = require('./taskRoutes');
// const applicationRoutes = require('./applicationRoutes');
// const agentRoutes = require('./agentRoutes');

// // API Routes
// router.use('/tasks', taskRoutes);
// router.use('/applications', applicationRoutes);
// router.use('/agents', agentRoutes);

// // Health check endpoint
// router.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Task Management API is running',
//     timestamp: new Date().toISOString()
//   });
// });

// module.exports = router;

// // app.js - Main application file
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const routes = require('./routes');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // Routes
// app.use('/api/v1', routes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // Database connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task_management', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };

// // Start server
// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();
  
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log(`API Documentation: http://localhost:${PORT}/api/v1/health`);
//   });
// };

// startServer();

// module.exports = app;