const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// --- CORS SETUP ---
const allowedOrigins = [
  'http://localhost:5173', // Superadmin
  'http://localhost:5174', // Admin
  'http://localhost:5175', // Agent
  'http://localhost:5176', // Subagent
  'http://localhost:5177', // Student

  // 🔒 Production domains (optional for now)
  // 'https://superadmin.example.com',
  // 'https://admin.example.com',
  // 'https://agent.example.com',
  // 'https://subagent.example.com',
  // 'https://student.example.com'
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/profilePictures', express.static(path.join(__dirname, 'profilePictures')));

const connectDB = require("./src/config/Agent/db");
connectDB();

app.use("/api/other-auth", require("./src/routes/Agent/auth.routes"));
app.use("/student", require("./src/routes/Agent/student.routes"));
app.use("/agent", require("./src/routes/Agent/agent.routes"));
app.use("/notification", require("./src/routes/Agent/notificationPreferences.routes"));

app.use("/api/password", require("./src/routes/SuperAdmin/passwordRoutes"));
app.use("/api/auth", require("./src/routes/SuperAdmin/authRoutes"));
app.use("/payment", require("./src/routes/SuperAdmin/paymentRoutes"));

// --- SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
