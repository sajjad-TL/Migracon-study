# Migracon-study-backend

This is the backend service for the Migracon Study platform. It handles user authentication, including registration, login (email/password and Google OAuth), and password recovery features.

## Features

- 📥 **Agent Registration** (with hashed password and consent tracking)
- 🔐 **Email & Password Login**
- 🔁 **Google Login (OAuth2)**
- 📧 **Forgot Password with OTP via Email**
- ✅ **OTP Verification**
- 🔄 **Reset Password using Verified OTP**

## Getting Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/sajjad-TL/Migracon-Study
   cd migracon-study-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file**

   ```env
   PORT=5000
   MONGO_URI=your_mongo_connection_string
   jwt_secret_key=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Run the server**

   ```bash
   npm start
   ```

   Server runs on: `http://localhost:5000`

## Agent API Endpoints

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Register a new agent       |
| POST   | `/api/auth/login`    | Login with email/password  |
| POST   | `/api/auth/google`   | Login using Google OAuth   |
| POST   | `/api/auth/forgot`   | Request password reset OTP |
| POST   | `/api/auth/verify`   | Verify OTP                 |
| POST   | `/api/auth/reset`    | Reset password using OTP   |

## 📚 Student API Endpoints

| Method | Endpoint                      | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| POST   | `/api/student/add-new`        | Add a new student                     |
| POST   | `/api/student/get`            | Get student by email, ID or passport  |
| DELETE | `/api/student/delete`         | Delete a student by ID                |
| POST   | `/api/student/all-students`   | Get all students for a specific agent |
| PUT    | `/api/student/update-student` | Update student details by ID          |

## License

MIT – feel free to use and modify.
