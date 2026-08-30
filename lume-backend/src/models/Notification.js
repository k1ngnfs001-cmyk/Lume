const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    type: {
      type: String,
      enum: [
        'like',
        'save',
        'comment',
        'comment_like',
        'reply',
        'share',
        'follow',
        'message',
        'story',
        'profile_view',
        'new_user',
        'new_login'
      ],
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    text: {
      type: String,
      default: ''
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    'Notification',
    NotificationSchema
  );