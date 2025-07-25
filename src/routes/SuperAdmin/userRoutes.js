const express = require('express');
const router = express.Router();
const userController = require('../../controllers/SuperAdmin/userController');

router.post('/create-access', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUserById);
router.put('/:id', userController.updateUserById);

module.exports = router;
