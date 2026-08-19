const mongoose = require('mongoose');

const PostSchema =
  new mongoose.Schema(
    {
      // =====================================================
      // AUTHOR
      // =====================================================

      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },


      // =====================================================
      // CONTENT
      // =====================================================

      content: {
        type: String,
        maxlength: 2200,
        default: '',
      },


      // =====================================================
      // MEDIA
      // =====================================================

      mediaUrl: {
        type: String,
        default: '',
      },

      mediaType: {
        type: String,
        enum: [
          'image',
          'video',
          'none',
        ],
        default: 'none',
      },


      // =====================================================
      // POST LIKES
      // =====================================================

      likes: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],


      // =====================================================
      // SAVED POSTS
      // =====================================================

      savedBy: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],


      // =====================================================
      // COMMENTS
      // =====================================================

      comments: [
        {
          user: {
            type:
              mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },

          text: {
            type: String,
            default: '',
          },


          // =================================================
          // COMMENT LIKES
          // =================================================

          likes: [
            {
              type:
                mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],


          // =================================================
          // REPLIES
          // =================================================

          replies: [
            {
              user: {
                type:
                  mongoose.Schema.Types.ObjectId,
                ref: 'User',
              },

              text: {
                type: String,
                default: '',
              },

              likes: [
                {
                  type:
                    mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                },
              ],

              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],


          // =================================================
          // COMMENT DATE
          // =================================================

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

module.exports =
  mongoose.model(
    'Post',
    PostSchema
  );