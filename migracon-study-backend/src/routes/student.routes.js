const express = require('express')
const router = express.Router()
const { addNewStudent, getStudent, deleteStudent } = require('../controllers/student.controller')


router.post('/add-new', addNewStudent)
router.post('/get', getStudent)
router.post('/delete', deleteStudent)

module.exports = router