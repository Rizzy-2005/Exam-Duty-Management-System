const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },                // Name of the exam
  dates: [{ type: Date, required: true }],               // Dates on which the exam happens
  sessions: {
    type: [String],
    enum: ["FN", "AN"],                                  // Forenoon / Afternoon
    default: ["FN", "AN"]
  },
  expectedStudents: {
    type: Map,
    of: Number,
    default: {}                                           // Stores expected student count per (date + session)
  },
});

module.exports = mongoose.model("exams", examSchema);
