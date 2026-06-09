const router = require('express').Router();
const controller = require('../controller/anomaly.controller');
const {authenticateToken} = require('../../middleware/auth.middleware');

router.post('/evaluate/:id', authenticateToken, controller.evaluate);
router.get('/', authenticateToken, controller.getAll);

module.exports = router;