//Defining teacher schema
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  password: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date, required: true },
  role: { type: String, required: true, enum: ['Teacher', 'COE'] },
  userId: {type: String, required: true, unique: true}
}, { timestamps: true });

module.exports = mongoose.model("users", userSchema);

