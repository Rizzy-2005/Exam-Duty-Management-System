const requests = require('../models/requestModel')
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

    // Prevent sending duplicate requests for same exam
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
      status: 'pending',
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
    const msgs = await requests
      .find({ toTeacherId: req.params.id })
      .populate('fromTeacherId', 'name email')
      .populate('toTeacherId', 'name email')
      .populate('examId', 'title date');

    res.status(200).send({ success: true, requestList: msgs });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
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
