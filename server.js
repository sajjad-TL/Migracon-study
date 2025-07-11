// ===== FIXED SERVER.JS =====
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, restrict to your frontend domain
    methods: ["GET", "POST"],
  },
});

// Attach io instance to app for global access
app.set("io", io);

// Socket connection events
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Join agent-specific room
  socket.on("join-agent-room", (agentId) => {
    socket.join(`agent-${agentId}`);
    console.log(`🏠 Agent ${agentId} joined room: agent-${agentId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// --- CORS SETUP ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  // 'https://your-production-domain.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE ---
const connectDB = require("./src/config/Agent/db");
connectDB();

// --- ROUTES ---
app.use("/api/other-auth", require("./src/routes/Agent/auth.routes"));
app.use("/student", require("./src/routes/Agent/student.routes"));
app.use("/agent", require("./src/routes/Agent/agent.routes"));
app.use("/notification", require("./src/routes/Agent/notificationPreferences.routes"));
app.use("/api/commission", require("./src/controllers/SuperAdmin/commissionController"));
app.use("/api/password", require("./src/routes/SuperAdmin/passwordRoutes"));
app.use("/api/auth", require("./src/routes/SuperAdmin/authRoutes"));
app.use("/payment", require("./src/routes/SuperAdmin/paymentRoutes"));
app.use("/api/schools", require("./src/routes/SuperAdmin/schoolRoutes"));
app.use("/api/programs", require("./src/routes/SuperAdmin/programRoutes"));
app.use("/api/reports", require("./src/routes/SuperAdmin/reportsRoutes"));
app.use("/api/universities", require("./src/routes/SuperAdmin/universityRoutes"));
app.use("/agent-notifications", require("./src/routes/Agent/agentNotification.routes"));
app.use('/profilePictures', express.static(path.join(__dirname, 'profilePictures')));


// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO on http://localhost:${PORT}`);
});
