const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
