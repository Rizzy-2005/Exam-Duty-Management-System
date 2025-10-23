const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')

router.get('/getUserInfo',teacherController.getInfo)
router.post('/getSchedule', teacherController.getSchedule);
router.post('/getAllocationDetails', teacherController.getAllocationDetails);

module.exports = router