const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },     
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeTablePdfUrl: { type: String, required: false, trim: true }
});

module.exports = mongoose.model("exams", examSchema);
