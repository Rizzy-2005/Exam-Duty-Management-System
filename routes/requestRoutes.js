const express = require("express");
const router = express.Router();
const requestController = require('../controllers/requestController')

router.post('/send', requestController.sendRequest);           
router.post('/receive', requestController.receiveRequest);  
router.put('/update/:id', requestController.updateRequestStatus);     

module.exports = router;