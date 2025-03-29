const express = require("express");
const authController = require('../Controller/authController');
const { identifier } = require("../middleware/identification");
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
module.exports = router;