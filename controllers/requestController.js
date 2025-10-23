const requests = require('../models/requestModel')
const allocationModel = require('../models/allocationModel')
const classroomModel = require('../models/classroomModel')
exports.sendRequest = async (req, res) => {
  try {
    const { scheduleId, toTeacherId, message, examId } = req.body;
    const fromTeacherId = req.session.user.id;

    if (!fromTeacherId || !toTeacherId || !examId || !scheduleId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (fromTeacherId === toTeacherId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    //Prevent sending duplicate requests for same exam
    const existing = await requests.findOne({
      fromTeacherId,
      toTeacherId,
      examId,
      allocationId: scheduleId,
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    const newRequest = new requests({
      examId,
      allocationId: scheduleId,
      fromTeacherId,
      toTeacherId,
      reason: message,
      status: 'Pending',
      createdAt: new Date(),
    });

    const savedRequest = await newRequest.save();
    res.status(201).json({ success: true, request: savedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.receiveRequest = async (req, res) => {
  try {
    const teacherId = req.session.user.id; // Get from session
    
    const msgs = await requests
      .find({ toTeacherId: teacherId, status: 'Pending' }) // Match your enum
      .populate('fromTeacherId', 'name email department')
      .populate('toTeacherId', 'name email')
      .populate('examId', 'title date')
      .populate({
        path: 'allocationId',
        populate: [
          { path: 'classroomId', select: 'name building' },
          { path: 'examId', select: 'title date' }
        ]
      })
      .sort({ createdAt: -1 });

    // Transform data to match frontend format
    const transformed = await Promise.all(msgs.map(async msg => {
      // Get the requester's schedule (fromTeacherId's allocation)
      const requesterAllocation = await allocationModel
        .findOne({ 
          teacherId: msg.fromTeacherId._id,
          examId: msg.examId._id,
          date: msg.allocationId.date,
          session: msg.allocationId.session
        })
        .populate('classroomId', 'name building');

      return {
        id: msg._id,
        requesterName: msg.fromTeacherId.name,
        requesterDepartment: msg.fromTeacherId.department || 'N/A',
        requestedAt: msg.createdAt,
        reason: msg.reason, // Changed from 'message' to 'reason'
        yourDuty: {
          dateDay: new Date(msg.allocationId.date).getDate(),
          dateMonth: new Date(msg.allocationId.date).toLocaleString('en-US', { month: 'short' }),
          session: msg.allocationId.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: msg.allocationId.classroomId.name,
            building: msg.allocationId.classroomId.building
          }
        },
        theirDuty: requesterAllocation ? {
          dateDay: new Date(requesterAllocation.date).getDate(),
          dateMonth: new Date(requesterAllocation.date).toLocaleString('en-US', { month: 'short' }),
          session: requesterAllocation.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: requesterAllocation.classroomId.name,
            building: requesterAllocation.classroomId.building
          }
        } : null
      };
    }));

    res.status(200).json({ 
      success: true, 
      data: transformed.filter(t => t.theirDuty !== null) // Remove if requester allocation not found
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateRequestStatus = async (req, res) => {
  const id = req.params.id;
  const stat = req.body.status;
  try {
    const updatedRequest = await requests.findByIdAndUpdate( id,{ $set: { status: stat } }, { new: true });
    if (!updatedRequest) {
      return res.status(404).send({ success: false, msg: "Request not found" });
    }
    res.status(200).send({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};
