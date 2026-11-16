const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'engineer'));

router.get('/', analyticsController.getAnalytics);

module.exports = router;
