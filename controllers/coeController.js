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

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Users.find(
      { role: 'Teacher' }, 
      { name: 1, userId: 1, department: 1, _id: 0 }
    ).sort({ name: 1 }); 

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: "No teachers found" });
    }

    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const autoAllocateTeachers = async (examId, selectedClassrooms, unavailableTeachers, exam) => {
  //Get available teachers
  const teachers = await Users.find({
    role: "Teacher",
    name: { $nin: unavailableTeachers }
  });
  console.log("First");
  //Count previous allocations for fair distribution
  const allocationCounts = await Allocation.aggregate([
    { $group: { _id: "$teacherId", count: { $sum: 1 } } }
  ]);
  console.log("First");
  const countMap = {};
  allocationCounts.forEach(a => (countMap[a._id.toString()] = a.count));
  console.log("First");

  //Sort teachers (less allocations first, then joining date)
  teachers.sort((a, b) => {
    const countA = countMap[a._id.toString()] || 0;
    const countB = countMap[b._id.toString()] || 0;
    if (countA !== countB) return countA - countB;
    return new Date(a.joiningDate) - new Date(b.joiningDate);
  });
  console.log("First");

  //Get classrooms
  const classrooms = await classroom.find({ name: { $in: selectedClassrooms } });

  //Handle expectedStudents as object
  let expectedStudentsObj = {};
  if (exam.expectedStudents instanceof Map) {
    exam.expectedStudents.forEach((val, key) => {
      expectedStudentsObj[key] = val;
    });
  } else {
    expectedStudentsObj = exam.expectedStudents;
  }

  //Build allocation entries
  const allocationsToInsert = [];
  let teacherIndex = 0;
  console.log("First");
  for (const date of exam.dates) {
    for (const session of exam.sessions) {
      const formattedDate = new Date(date).toISOString().split("T")[0];
      const key = `${formattedDate}_${session}`;
      const totalStudents = expectedStudentsObj[key] || 0;

      if (totalStudents <= 0) continue; //skip if no students

      //Sort classrooms by capacity descending
      const sortedClassrooms = classrooms.slice().sort((a, b) => b.capacity - a.capacity);

      let remainingStudents = totalStudents;
      console.log("Total students:", totalStudents);
      let roomIndex = 0;

      while (remainingStudents > 0 && roomIndex < sortedClassrooms.length) {
        const room = sortedClassrooms[roomIndex];
        if (teacherIndex >= teachers.length) teacherIndex = 0;

        allocationsToInsert.push({
          examId,
          teacherId: teachers[teacherIndex]._id,
          classroomId: room._id,
          date,
          session
        });

        remainingStudents -= room.capacity;
        teacherIndex++;
        roomIndex++;
      }

      if (remainingStudents > 0) {
        console.warn(`Warning: Not enough classroom capacity for ${remainingStudents} students on ${date} session ${session}`);
      }
    }
  }

  return await Allocation.insertMany(allocationsToInsert);
};



exports.createExam = async (req, res) => {
  try {
    const { examName, examDatesWithSessions, selectedClassrooms, unavailableTeachers } = req.body;

    //Convert frontend object to schema format
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

    //Save Exam
    const exam = new Exam({
      name: examName,
      dates: allDates,
      sessions: Array.from(allSessions),
      expectedStudents
    });
    await exam.save();

    //Auto allocate teachers
    const allocations = await autoAllocateTeachers(exam._id, selectedClassrooms,unavailableTeachers,exam);

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
