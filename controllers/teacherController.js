const schedules = require('../models/allocationModel');
const Exam = require('../models/examModel');
const Class = require('../models/classroomModel')

exports.getSchedule = async (req, res) => {
try {
    const teacherId = req.body.teacherId;

    if (!teacherId) {
        return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
        });
    }

    const allocations = await schedules.find({ teacherId })
        .populate('examId', 'title')
        .populate('classroomId', 'name building') 
        .sort({ date: 1, session: 1 });

    // Transform data for frontend
    const transformedSchedules = allocations.map(schedule => {
        const currentDate = new Date();
        const examDate = new Date(schedule.date);
        
        const isAttended = examDate < currentDate;
        
        return {
        id: schedule._id,
        date: examDate,
        dateDay: examDate.getDate(),
        dateMonth: examDate.toLocaleString('en-US', { month: 'short' }),
        session: schedule.session === 'FN' ? 'Morning' : 'Afternoon',
        sessionCode: schedule.session,
        classroom: {
            number: schedule.classroomId.name,
            building: schedule.classroomId.building
        },
        exam: {
            title: schedule.examId.title,
        },
        status: isAttended ? 'attended' : 'pending'
        };
    });

    res.status(200).json({
        success: true,
        count: transformedSchedules.length,
        data: transformedSchedules
    });

} catch (error) {
console.error('Error fetching schedules:', error);
res.status(500).json({
    success: false,
    message: 'Failed to fetch schedules',
    error: error.message
});
}
};
exports.getAllocationDetails = async (req, res) => {
  try {
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ success: false, message: 'Schedule ID is required' });
    }

    // Find the clicked schedule
    const allocation = await schedules.findById(scheduleId)
      .populate('examId', 'title date')
      .populate('classroomId', 'name building')
      .populate('teacherId', 'name');

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Schedule not found', data: [] });
    }

    const examDate = new Date(allocation.date);

    //Fetch allocations for the same date and all upcoming dates
    const relatedAllocations = await schedules.find({
      date: { $gte: examDate }   // same day and future days
    })
    .populate('teacherId', 'name')
    .populate('classroomId', 'name building')
    .populate('examId', 'title')
    .sort({ date: 1, session: 1 });

    //Transform data with full date info
    const transformed = relatedAllocations.map(a => {
      const dateObj = new Date(a.date);
      return {
        id: a._id,
        teacher: a.teacherId.name,
        teacherId: a.teacherId,
        date: dateObj.toISOString().split('T')[0],  // YYYY-MM-DD
        dateDay: dateObj.getDate(),
        dateMonth: dateObj.toLocaleString('en-US', { month: 'short' }),
        dateYear: dateObj.getFullYear(),
        classroom: {
          number: a.classroomId.name,
          building: a.classroomId.building
        },
        exam: {
          title: a.examId.title,
          id: a.examId
        },
        session: a.session === 'FN' ? 'Morning' : 'Afternoon'
      };
    });

    res.status(200).json({ success: true, data: transformed });

  } catch (error) {
    console.error('Error fetching allocation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch allocation details',
      error: error.message
    });
  }
};
