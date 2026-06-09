const router = require('express').Router();
const controller = require('../controller/flag.controller');
const {authenticateToken} = require('../../middleware/auth.middleware');

router.post('/', authenticateToken, controller.create);
router.get('/:id', authenticateToken, controller.getByProcurement);

module.exports = router;