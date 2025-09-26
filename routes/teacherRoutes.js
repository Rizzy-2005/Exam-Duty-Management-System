const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')


router.post('/getSchedule', teacherController.getSchedule)

module.exports = router