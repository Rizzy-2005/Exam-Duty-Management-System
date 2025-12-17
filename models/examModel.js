const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },              
  dates: [{ type: Date, required: true }],              
  sessions: {
    type: [String],
    enum: ["FN", "AN"],                                  
    default: ["FN", "AN"]
  },
  expectedStudents: {
    type: Map,
    of: Number,
    default: {}                                           
  },
});

module.exports = mongoose.model("exams", examSchema);
