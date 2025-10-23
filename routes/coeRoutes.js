//Importing the modules and controller
const express = require("express");
const router = express.Router();
const coeController = require("../controllers/coeController");
const path = require('path');

//Rerouting to controller.
router.post('/addTeacher', coeController.addTeacher);
router.get('/getClassrooms',coeController.loadClassrooms);
router.get('/getTeachers', coeController.getTeachers);
router.post('/createExam', coeController.createExam);
router.get('/getExams',coeController.getExams);
router.get('/allocations/:id', (req, res) => {
console.log('[ROUTE HIT] /allocations/:id → ID:', req.params.id);
  res.sendFile(path.join(__dirname, '../views/viewAllocation.html'));
});
router.get('/getAllocations/:examId', coeController.getAllocations);
router.get('/getExam/:id', coeController.getExamById);
router.put('/updateAllocation/:id', coeController.updateAllocation);
router.get("/teachers", coeController.getAllTeachers);
router.delete("/teachers/:id", coeController.deleteTeacher);
router.get("/classrooms", coeController.getAllClassrooms);
router.post("/addClassroom", coeController.addClassroom);
router.put("/updateClassroom/:id", coeController.updateClassroom);



module.exports = router;
