const commentModel = require('../models/commentModel');
const ticketModel = require('../models/ticketModel');
const { recordHistory } = require('../utils/auditLogger');
const { logEvent } = require('../utils/cloudwatchLogger');

const commentController = {
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { comment, isInternal = false } = req.body;

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content cannot be empty.'
        });
      }

      const ticket = await ticketModel.findById(id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.'
        });
      }

      // Check permission: Users can only comment on their own tickets
      if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only comment on tickets created by you.'
        });
      }

      // Only engineers and admins can post internal comments
      const canPostInternal = ['engineer', 'admin'].includes(req.user.role);
      const internalFlag = canPostInternal ? Boolean(isInternal) : false;

      const newComment = await commentModel.create({
        ticketId: ticket.id,
        userId: req.user.id,
        comment: comment.trim(),
        isInternal: internalFlag
      });

      // Add to ticket history
      await recordHistory({
        ticketId: ticket.id,
        userId: req.user.id,
        action: 'COMMENT_ADDED',
        newValue: internalFlag ? '[Internal Note]' : '[Public Comment]',
        notes: comment.trim().slice(0, 150)
      });

      logEvent('COMMENT_ADDED', {
        ticketId: ticket.id,
        commentId: newComment.id,
        userId: req.user.id,
        isInternal: internalFlag
      });

      // Return comment with author details
      const responseComment = {
        ...newComment,
        author_name: req.user.name,
        author_email: req.user.email,
        author_role: req.user.role
      };

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        data: {
          comment: responseComment
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete comment (Admin only)
   */
  async deleteComment(req, res, next) {
    try {
      const { ticketId, commentId } = req.params;

      const comment = await commentModel.findById(commentId);
      if (!comment || String(comment.ticket_id) !== String(ticketId)) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found for this ticket.'
        });
      }

      await commentModel.delete(comment.id);

      logEvent('COMMENT_DELETED', {
        ticketId,
        commentId,
        deletedBy: req.user.id
      });

      return res.status(200).json({
        success: true,
        message: 'Comment successfully deleted.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = commentController;
