//Importing the models
const Users = require("../models/userModel");
const classroom = require('../models/classroomModel');
const Exam = require("../models/examModel");
const Allocation = require("../models/allocationModel");

exports.addTeacher = async (req, res) => {
  try {
    const receivedData = req.body;
    const teacherId = receivedData['userId'];

    console.log('Received teacherId:', teacherId);

    //Check if teacher already exists
    const existingRecord = await Users.findOne({ userId: teacherId });

    if (existingRecord) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    //Use received data
    const newTeacher = new Users(receivedData);
    await newTeacher.save();

    res.json({ message: 'Teacher added successfully' });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loadClassrooms = async (req,res)=>{
        try {
        const classes = await classroom.find({}, { name: 1, building: 1, _id: 0 });

        if (!classes || classes.length === 0) {
            return res.status(404).json({ message: "No classrooms were found" });
        }
        res.json(classes);
    } catch (error) {
        console.error("Error loading classrooms:", error);
        res.status(500).json({ message: "Server error" });
    }
}

exports.getExams = async (req,res) => {
  try{
  const exams = await Exam.find()
  if (!exams || exams.length === 0){
    return res.status(404).json({ message: "No exam found" });
  }
  res.json(exams);
  }
  catch(error){
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    // Fetch only users with role 'Teacher'
    const teachers = await Users.find(
      { role: 'Teacher' }, 
      { name: 1, userId: 1, department: 1, _id: 0 }
    ).sort({ name: 1 }); // Sort alphabetically by name

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: "No teachers found" });
    }

    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.createExam = async (req, res) => {
  try {
    const { examName, examDatesWithSessions, selectedClassrooms, unavailableTeachers } = req.body;

    //Step 1: Convert frontend object to schema format
    const allDates = Object.keys(examDatesWithSessions);
    const allSessions = new Set();
    const expectedStudents = new Map();

    allDates.forEach(date => {
      const sessions = examDatesWithSessions[date];
      Object.keys(sessions).forEach(session => {
        allSessions.add(session);
        const key = `${date}_${session}`;
        expectedStudents.set(key, sessions[session].capacity || 0);
      });
    });

    //Step 2: Save Exam
    const exam = new Exam({
      name: examName,
      dates: allDates,
      sessions: Array.from(allSessions),
      expectedStudents
    });
    await exam.save();

    //Step 3: Auto allocate teachers
    //const allocations = await autoAllocateTeachers({examId: exam._id, selectedClassrooms,unavailableTeachers,exam});

    res.status(201).json({
      success: true,
      message: "Exam created and teachers allocated successfully!",
      exam,
      allocations
    });

  } catch (err) {
    console.error("Error creating exam:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    console.error("Error fetching exam:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllocations = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log(`[CONTROLLER] Fetching allocations for examId: ${examId}`);

    const allocations = await Allocation.find({ examId })
      .populate('teacherId', 'name userId')
      .populate('classroomId'); // Remove field selection temporarily

    // Debug log
    console.log('Sample allocation:', JSON.stringify(allocations[0], null, 2));

    console.log(`[SUCCESS] Found ${allocations.length} allocations`);
    res.json(allocations);

  } catch (error) {
    console.error('[ERROR] getAllocations failed:', error);
    res.status(500).json({ message: 'Server error fetching allocations' });
  }
};

