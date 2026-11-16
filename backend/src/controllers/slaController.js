const slaModel = require('../models/slaModel');
const { invalidateSlaCache } = require('../utils/slaCalculator');
const { logEvent } = require('../utils/cloudwatchLogger');

const slaController = {
  async getSlaConfigs(req, res, next) {
    try {
      let configs = await slaModel.getAll();
      if (!configs || configs.length === 0) {
        await slaModel.seedDefaults();
        configs = await slaModel.getAll();
      }

      return res.status(200).json({
        success: true,
        data: {
          configs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSlaConfig(req, res, next) {
    try {
      const { priority, targetMinutes, description } = req.body;
      const validPriorities = ['Critical', 'High', 'Medium', 'Low'];

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: [${validPriorities.join(', ')}]`
        });
      }

      const minutes = parseInt(targetMinutes, 10);
      if (isNaN(minutes) || minutes < 1) {
        return res.status(400).json({
          success: false,
          message: 'targetMinutes must be a positive integer.'
        });
      }

      await slaModel.update(priority, minutes, description);
      invalidateSlaCache();

      logEvent('SLA_CONFIG_UPDATED', {
        priority,
        targetMinutes: minutes,
        updatedBy: req.user.id
      });

      const updated = await slaModel.findByPriority(priority);

      return res.status(200).json({
        success: true,
        message: `SLA target for ${priority} updated to ${minutes} minutes.`,
        data: {
          config: updated
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = slaController;
