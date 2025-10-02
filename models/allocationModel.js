const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'exams', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'classrooms', required: true },
  date: { type: Date, required: true },                
  session: { type: String, enum: ['FN', 'AN'], required: true } 
});

module.exports = mongoose.model("allocations", allocationSchema);
