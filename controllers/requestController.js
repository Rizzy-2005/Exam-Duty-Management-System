const requests = require('../models/requestModel')
const allocationModel = require('../models/allocationModel')
const classroomModel = require('../models/classroomModel')
exports.sendRequest = async (req, res) => {
  try {
    const { fromAllocationId, toAllocationId, toTeacherId, message, examId } = req.body;
    const fromTeacherId = req.session.user.id;

    if (!fromTeacherId || !toTeacherId || !examId || !fromAllocationId || !toAllocationId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (fromTeacherId === toTeacherId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    // Prevent sending duplicate requests
    const existing = await requests.findOne({
      fromTeacherId,
      toTeacherId,
      examId,
      fromAllocationId,
      toAllocationId,
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    const newRequest = new requests({
      examId,
      fromAllocationId,
      toAllocationId,
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
    const teacherId = req.session.user.id;
    
    const msgs = await requests
      .find({ toTeacherId: teacherId, status: 'Pending' })
      .populate('fromTeacherId', 'name email department')
      .populate('toTeacherId', 'name email')
      .populate('examId', 'title date')
      .populate({
        path: 'fromAllocationId',
        populate: [
          { path: 'classroomId', select: 'name building' },
          { path: 'examId', select: 'title date' }
        ]
      })
      .populate({
        path: 'toAllocationId',
        populate: [
          { path: 'classroomId', select: 'name building' },
          { path: 'examId', select: 'title date' }
        ]
      })
      .sort({ createdAt: -1 });

    // Transform data to match frontend format
    const transformed = msgs.map(msg => {
      return {
        id: msg._id,
        requesterName: msg.fromTeacherId.name,
        requesterDepartment: msg.fromTeacherId.department || 'N/A',
        requestedAt: msg.createdAt,
        reason: msg.reason,
        yourDuty: {
          dateDay: new Date(msg.toAllocationId.date).getDate(),
          dateMonth: new Date(msg.toAllocationId.date).toLocaleString('en-US', { month: 'short' }),
          session: msg.toAllocationId.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: msg.toAllocationId.classroomId.name,
            building: msg.toAllocationId.classroomId.building
          }
        },
        theirDuty: {
          dateDay: new Date(msg.fromAllocationId.date).getDate(),
          dateMonth: new Date(msg.fromAllocationId.date).toLocaleString('en-US', { month: 'short' }),
          session: msg.fromAllocationId.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: msg.fromAllocationId.classroomId.name,
            building: msg.fromAllocationId.classroomId.building
          }
        }
      };
    });

    res.status(200).json({ 
      success: true, 
      data: transformed
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
    const request = await requests.findById(id)
      .populate('fromAllocationId')
      .populate('toAllocationId');
    
    if (!request) {
      return res.status(404).send({ success: false, msg: "Request not found" });
    }

    // If accepting the request, swap the allocations
    if (stat === 'Approved') {
      const fromAlloc = request.fromAllocationId;
      const toAlloc = request.toAllocationId;

      // Swap the teacherIds in both allocations
      const fromTeacherId = fromAlloc.teacherId;
      const toTeacherId = toAlloc.teacherId;

      await allocationModel.findByIdAndUpdate(fromAlloc._id, {
        teacherId: toTeacherId
      });

      await allocationModel.findByIdAndUpdate(toAlloc._id, {
        teacherId: fromTeacherId
      });
    }

    // Update the request status
    const updatedRequest = await requests.findByIdAndUpdate(
      id,
      { $set: { status: stat } },
      { new: true }
    );

    res.status(200).send({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(400).send({ success: false, msg: error.message });
  }
};

// Get the count of pending requests for logged-in teacher
exports.getPendingCount = async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const count = await requests.countDocuments({ toTeacherId: teacherId, status: 'Pending' });
    
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching pending request count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add this to your request controller

exports.getHistory = async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    
    // Get all requests where teacher is either sender OR receiver, and status is Approved/Rejected
    const msgs = await requests
      .find({ 
        $or: [
          { fromTeacherId: teacherId },
          { toTeacherId: teacherId }
        ],
        status: { $in: ['Approved', 'Rejected'] }
      })
      .populate('fromTeacherId', 'name department')
      .populate('toTeacherId', 'name department')
      .populate({
        path: 'fromAllocationId',
        populate: { path: 'classroomId', select: 'name building' }
      })
      .populate({
        path: 'toAllocationId',
        populate: { path: 'classroomId', select: 'name building' }
      })
      .sort({ updatedAt: -1 });

    // Transform data
    const transformed = msgs.map(msg => {
      const isSentByMe = msg.fromTeacherId._id.toString() === teacherId.toString();
      
      return {
        id: msg._id,
        type: isSentByMe ? 'sent' : 'received',
        requesterName: msg.fromTeacherId.name,
        requesterDepartment: msg.fromTeacherId.department || 'N/A',
        receiverName: msg.toTeacherId.name,
        requestedAt: msg.createdAt,
        respondedAt: msg.updatedAt,
        status: msg.status,
        reason: msg.reason || '',
        yourDuty: {
          dateDay: new Date(msg.toAllocationId.date).getDate(),
          dateMonth: new Date(msg.toAllocationId.date).toLocaleString('en-US', { month: 'short' }),
          session: msg.toAllocationId.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: msg.toAllocationId.classroomId.name,
            building: msg.toAllocationId.classroomId.building
          }
        },
        theirDuty: {
          dateDay: new Date(msg.fromAllocationId.date).getDate(),
          dateMonth: new Date(msg.fromAllocationId.date).toLocaleString('en-US', { month: 'short' }),
          session: msg.fromAllocationId.session === 'FN' ? 'Morning' : 'Afternoon',
          classroom: {
            number: msg.fromAllocationId.classroomId.name,
            building: msg.fromAllocationId.classroomId.building
          }
        }
      };
    });

    res.status(200).json({ 
      success: true, 
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching request history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
