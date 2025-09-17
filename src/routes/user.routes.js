const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Example endpoint
router.get('/', userController.getAllUsers);

module.exports = router;
