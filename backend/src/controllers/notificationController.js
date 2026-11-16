const notificationModel = require('../models/notificationModel');

const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { onlyUnread } = req.query;
      const notifications = await notificationModel.findByUserId(
        req.user.id,
        onlyUnread === 'true'
      );
      const unreadCount = await notificationModel.countUnread(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await notificationModel.markAsRead(id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.'
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await notificationModel.markAllAsRead(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.'
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      await notificationModel.delete(id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Notification removed.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
