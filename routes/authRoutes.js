//Importing the modules and controller
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//Rerouting to controller.
router.post('/', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
