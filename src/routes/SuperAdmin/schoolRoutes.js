const express = require('express');
const router = express.Router();
const schoolController = require('../../controllers/SuperAdmin/schoolController');
const upload = require('../../middlewares/upload'); // <-- your multer middleware

// Add image upload to school creation
router.post('/create', upload.single('image'), schoolController.createSchool);
router.get('/all', schoolController.getAllSchools);

router.get('/', schoolController.getAllSchools);
router.get('/stats', schoolController.getSchoolsWithStats);
router.get('/:id', schoolController.getSchoolById);
router.patch('/:id', schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

module.exports = router;
