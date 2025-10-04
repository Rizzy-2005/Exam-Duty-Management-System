const express = require("express");
const router = express.Router();
const requestController = require('../controllers/requestController')

router.post('/sendReq', requestController.sendRequest);           
router.get('/receiveReq/:teacherId', requestController.receiveRequest);  
router.put('/:id/accept', requestController.acceptReq);           
router.put('/:id/decline', requestController.declineReq);         

module.exports = router;