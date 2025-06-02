const express = require("express");
const router = express.Router();
const upload = require('../../middlewares/upload');
// const { uploadDocument } = require('../controllers/student.controller');
const {
  addNewStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  newApplication,
  getAllApplications,
  getAllStudents,
  updateApplication,
  getLatestApplications,
  uploadDocument,
  deleteDocument


} = require("../../controllers/Agent/student.controller");


router.get("/getAllApplications", getAllApplications);
router.post("/add-new", addNewStudent);
router.delete("/delete", deleteStudent);
router.patch("/update-student", updateStudent);

router.post('/upload-document/:studentId', upload.single('file'), uploadDocument);
router.delete('/students/:studentId/documents/:filename', deleteDocument);


router.post('/:studentId/new-application', newApplication);
router.patch('/:studentId/update-application/:applicationId', updateApplication);



router.get("/getAllStudents", getAllStudents); 
router.get("/latestApplications" ,  getLatestApplications)


router.get("/:studentId", getStudent);

module.exports = router;