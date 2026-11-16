const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Get role-tailored dashboard stats
router.get('/stats', dashboardController.getStats);

module.exports = router;
