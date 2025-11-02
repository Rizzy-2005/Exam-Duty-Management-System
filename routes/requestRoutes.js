const express = require("express");
const router = express.Router();
const requestController = require('../controllers/requestController')

router.post('/send', requestController.sendRequest);           
router.post('/receive', requestController.receiveRequest);  
router.put('/update/:id', requestController.updateRequestStatus);    
router.get('/pending-count', requestController.getPendingCount);
router.get('/history',requestController.getHistory);


module.exports = router;