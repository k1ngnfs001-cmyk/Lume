const mongoose = require('mongoose');


const NotificationSchema = new mongoose.Schema(
  {
    // =====================================================
    // RECIPIENT
    // Kimga notification boradi
    // =====================================================

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },


    // =====================================================
    // SENDER
    // Kim notification yubordi
    // =====================================================

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },


    // =====================================================
    // TYPE
    // Notification turi
    // =====================================================

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
      ],

      required: true,
    },


    // =====================================================
    // REFERENCE
    // Qaysi post/comment bilan bog'langan
    // =====================================================

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },


    // =====================================================
    // TEXT
    // Notification matni
    // =====================================================

    text: {
      type: String,
      default: '',
    },


    // =====================================================
    // READ STATUS
    // =====================================================

    isRead: {
      type: Boolean,
      default: false,
    },
  },


  // =======================================================
  // TIMESTAMPS
  // createdAt / updatedAt avtomatik yaratiladi
  // =======================================================

  {
    timestamps: true,
  }
);


module.exports =
  mongoose.model(
    'Notification',
    NotificationSchema
  );