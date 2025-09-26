//Importing the modules and controller
const express = require("express");
const router = express.Router();
const coeController = require("../controllers/coeController");

//Rerouting to controller.
router.post('/addTeacher', coeController.addTeacher);

module.exports = router;
