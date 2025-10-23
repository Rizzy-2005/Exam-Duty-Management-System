//Importing the models
const Users = require("../models/userModel");
const Classroom = require('../models/classroomModel');
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
        const classes = await Classroom.find({}, { name: 1, building: 1, _id: 1 });

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
    const teachers = await Users.find(
      { role: 'Teacher' }, 
      { name: 1, userId: 1, department: 1, _id: 1 }
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

  //Count previous allocations for fair distribution
  const allocationCounts = await Allocation.aggregate([
    { $group: { _id: "$teacherId", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  allocationCounts.forEach(a => (countMap[a._id.toString()] = a.count));

  //Sort teachers (less allocations first, then joining date)
  teachers.sort((a, b) => {
    const countA = countMap[a._id.toString()] || 0;
    const countB = countMap[b._id.toString()] || 0;
    if (countA !== countB) return countA - countB;
    return new Date(a.joiningDate) - new Date(b.joiningDate);
  });

  //Get classrooms
  const classrooms = await Classroom.find({ name: { $in: selectedClassrooms } });

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

exports.updateAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, classroomId } = req.body;

    console.log(`[CONTROLLER] Updating allocation ${id}`);
    console.log('Request body:', req.body);

    // Simple update without pre-validation
    const updatedAllocation = await Allocation.findByIdAndUpdate(
      id,
      { 
        teacherId, 
        classroomId 
      },
      { new: true }
    )
    .populate('teacherId', 'name userId')
    .populate('classroomId', 'name building');

    if (!updatedAllocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    console.log('[SUCCESS] Allocation updated');
    res.json({ 
      message: 'Allocation updated successfully', 
      allocation: updatedAllocation 
    });

  } catch (error) {
    console.error('[ERROR] Full error:', error);
    res.status(500).json({ 
      message: 'Server error updating allocation',
      error: error.message 
    });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Users.find({ role: "Teacher" }).select("-password");
    res.json(teachers);
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Users.findOneAndDelete({ _id: id, role: "Teacher" });

    if (!teacher)
      return res.status(404).json({ message: "Teacher not found" });

    res.json({ message: `Teacher ${teacher.name} deleted successfully` });
  } catch (err) {
    console.error("Error deleting teacher:", err);
    res.status(500).json({ message: "Failed to delete teacher" });
  }
};

exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch classrooms" });
  }
};

//Add classroom
exports.addClassroom = async (req, res) => {
  try {
    const { name, building, capacity } = req.body;
    if (!name || !building || !capacity) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const classroom = new Classroom({ name, building, capacity });
    await classroom.save();
    res.json({ message: "Classroom added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error adding classroom" });
  }
};

//Update classroom
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, building, capacity } = req.body;
    const updated = await Classroom.findByIdAndUpdate(
      id,
      { name, building, capacity },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Classroom not found" });
    res.json({ message: "Classroom updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error updating classroom" });
  }
};