//Defining teacher schema
const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  department: {type: String, required: true},
  password: {type: String, required: true},
  joiningDate: {type: Date, required: true},
  gender: {type: String, required: true, enum: ['Male', 'Female', 'Other']},
  dob: {type: Date, required: true}
  },
  {timestamps: true}
);

module.exports = mongoose.model("teacher", teacherSchema);

