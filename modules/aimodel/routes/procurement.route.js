const router = require('express').Router();

const controller = require('../controller/procurement.controller');
const upload = require('../../middleware/upload.middleware');
const { authenticateToken } = require('../../middleware/auth.middleware');




// 🔵 Manual prediction
router.post('/predict', authenticateToken, controller.manualPredict);

// 🟢 CSV upload
router.post('/predict/csv', authenticateToken, upload.single('file'), controller.predictCSV);

// 🟣 PDF upload
router.post('/predict/pdf', authenticateToken, upload.single('file'), controller.predictPDF);

// 🔵 Get procurement
router.get('/all', authenticateToken , controller.getall)


router.get('/:id', authenticateToken, controller.get);


module.exports = router;