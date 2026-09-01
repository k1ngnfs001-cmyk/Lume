const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      maxlength: 2200,
      default: '',
    },

    mediaUrl: {
      type: String,
      default: '',
    },

    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none',
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },

        text: {
          type: String,
          default: '',
        },

        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],

        replies: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },

            text: {
              type: String,
              default: '',
            },

            likes: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
              },
            ],

            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', PostSchema);