const ticketModel = require('../models/ticketModel');
const userModel = require('../models/userModel');

const dashboardController = {
  async getStats(req, res, next) {
    try {
      const { dateRange } = req.query;
      const stats = await ticketModel.getStatistics({
        userId: req.user.id,
        role: req.user.role,
        dateRange
      });

      // If admin, also include user count breakdown
      let userStats = null;
      if (req.user.role === 'admin') {
        userStats = await userModel.countByRole();
      }

      return res.status(200).json({
        success: true,
        data: {
          ...stats,
          userBreakdown: userStats
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
