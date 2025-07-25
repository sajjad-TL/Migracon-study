const express = require('express');
const router = express.Router();
const programController = require('../../controllers/SuperAdmin/studyProgramController');

router.post('/', programController.createProgram);
router.get('/', programController.getAllPrograms);
router.get('/:id', programController.getProgramById);
router.put('/:id', programController.updateProgramById);
router.delete('/:id', programController.deleteProgramById);

module.exports = router;
