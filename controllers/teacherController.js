const schedules = require('../models/allocationModel');
const Exam = require('../models/examModel');
const Class = require('../models/classroomModel')

exports.getSchedule = async (req, res) => {
try {
    const teacherId = req.body.teacherId || req.params.teacherId || req.user?.id;

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