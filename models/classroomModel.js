const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  building: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1 }
});


module.exports = mongoose.model("classrooms", classroomSchema);
