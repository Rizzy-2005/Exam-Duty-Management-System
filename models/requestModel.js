const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'exams', required: true },
  fromAllocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'allocations', required: true }, // ADD THIS
  toAllocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'allocations', required: true }, // RENAME allocationId
  fromTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  toTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }, 
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("requests", requestSchema); 