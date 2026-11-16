const settingsModel = require('../models/settingsModel');
const { logEvent } = require('../utils/cloudwatchLogger');

const settingsController = {
  async getSettings(req, res, next) {
    try {
      const data = await settingsModel.getAll();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid settings payload.'
        });
      }

      await settingsModel.bulkUpdate(settings);

      logEvent('SYSTEM_SETTINGS_UPDATED', {
        updatedBy: req.user.id,
        keys: Object.keys(settings)
      });

      const updated = await settingsModel.getAll();
      return res.status(200).json({
        success: true,
        message: 'System settings saved successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = settingsController;
