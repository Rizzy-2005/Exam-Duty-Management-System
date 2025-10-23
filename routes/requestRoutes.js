const express = require("express");
const router = express.Router();
const requestController = require('../controllers/requestController')

router.post('/send', requestController.sendRequest);           
router.get('/received/:teacherId', requestController.receiveRequest);  
router.patch('/:id', requestController.updateRequestStatus)        

module.exports = router;