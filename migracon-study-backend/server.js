const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
require("dotenv").config();
const path = require('path')

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/profilePictures', express.static(path.join(__dirname, 'profilePictures')));

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/student", require("./src/routes/student.routes"));
app.use("/agent", require("./src/routes/agent.routes"));

connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
