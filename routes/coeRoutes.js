//Importing the modules and controller
const express = require("express");
const router = express.Router();
const coeController = require("../controllers/coeController");

//Rerouting to controller.
router.post('/addTeacher', coeController.addTeacher);
router.get('/createExam',coeController.loadClassrooms);
router.get('/getTeachers', coeController.getTeachers);


module.exports = router;
