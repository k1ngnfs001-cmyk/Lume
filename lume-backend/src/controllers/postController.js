const Post = require('../models/Post');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');


// =========================================================
// HELPERS
// =========================================================

const sameId = (a, b) => {
  if (a == null || b == null) {
    return false;
  }

  return a.toString() === b.toString();
};

const emitNotification = async (
  req,
  notification
) => {
  const io = req.app.get('io');

  if (!io) {
    return;
  }

  const populated =
    await notification.populate(
      'sender',
      'username avatar'
    );

  io.to(
    notification.recipient.toString()
  ).emit(
    'new_notification',
    populated
  );
};

const getProcessedPost = (
  post,
  userId
) => {
  const obj =
    post.toObject
      ? post.toObject()
      : post;

  return {
    ...obj,

    isLikedByMe:
      Array.isArray(obj.likes) &&
      obj.likes.some(
        id => sameId(id, userId)
      ),

    isSavedByMe:
      Array.isArray(obj.savedBy) &&
      obj.savedBy.some(
        id => sameId(id, userId)
      )
  };
};


// =========================================================
// CREATE POST
// =========================================================

exports.createPost = async (req, res) => {
  try {
    const {
      content = ''
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message:
          'Медиа-файл не найден или не загружен.'
      });
    }

    const b64 =
      Buffer
        .from(req.file.buffer)
        .toString('base64');

    const dataURI =
      `data:${req.file.mimetype};base64,${b64}`;

    const result =
      await cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'lume_posts',
          resource_type: 'auto'
        }
      );

    const post =
      await Post.create({
        user: req.user._id,
        content,
        mediaUrl: result.secure_url,
        mediaType:
          result.resource_type === 'video'
            ? 'video'
            : 'image'
      });

    await post.populate([
      {
        path: 'user',
        select:
          'username avatar isVerified'
      },
      {
        path: 'comments.user',
        select:
          'username avatar isVerified'
      },
      {
        path: 'comments.replies.user',
        select:
          'username avatar isVerified'
      }
    ]);

    res.status(201).json(
      getProcessedPost(
        post,
        req.user._id
      )
    );
  } catch (error) {
    console.error(
      'Ошибка создания поста:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// GET FEED
// =========================================================

exports.getFeed = async (req, res) => {
  try {
    const userId =
      req.user._id;

    const posts =
      await Post.find()
        .sort({
          createdAt: -1
        })
        .populate(
          'user',
          'username avatar isVerified'
        )
        .populate(
          'comments.user',
          'username avatar isVerified'
        )
        .populate(
          'comments.replies.user',
          'username avatar isVerified'
        );

    res.json(
      posts.map(
        post =>
          getProcessedPost(
            post,
            userId
          )
      )
    );
  } catch (error) {
    console.error(
      'Ошибка загрузки ленты:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// GET FOLLOWING POSTS
// =========================================================

exports.getFollowingPosts = async (
  req,
  res
) => {
  try {
    const userId =
      req.user._id;

    const currentUser =
      await User.findById(
        userId
      ).select('following');

    const followingIds =
      currentUser?.following || [];

    const posts =
      await Post.find({
        user: {
          $in: followingIds
        }
      })
        .sort({
          createdAt: -1
        })
        .populate(
          'user',
          'username avatar isVerified'
        )
        .populate(
          'comments.user',
          'username avatar isVerified'
        )
        .populate(
          'comments.replies.user',
          'username avatar isVerified'
        );

    res.json(
      posts.map(
        post =>
          getProcessedPost(
            post,
            userId
          )
      )
    );
  } catch (error) {
    console.error(
      'Ошибка загрузки подписок:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// LIKE POST
// =========================================================

exports.toggleLike = async (
  req,
  res
) => {
  try {
    const postId =
      req.params.id;

    const userId =
      req.user._id;

    const post =
      await Post.findById(
        postId
      ).select(
        'user likes'
      );

    if (!post) {
      return res.status(404).json({
        message:
          'Пост не найден'
      });
    }

    const isLiked =
      Array.isArray(
        post.likes
      ) &&
      post.likes.some(
        id =>
          sameId(
            id,
            userId
          )
      );

    const updatedPost =
      await Post.findByIdAndUpdate(
        postId,
        isLiked
          ? {
              $pull: {
                likes: userId
              }
            }
          : {
              $addToSet: {
                likes: userId
              }
            },
        {
          new: true,
          select:
            'user likes'
        }
      );

    if (!updatedPost) {
      return res.status(404).json({
        message:
          'Пост не найден'
      });
    }

    if (
      !isLiked &&
      !sameId(
        post.user,
        userId
      )
    ) {
      const notification =
        await Notification.create({
          recipient:
            post.user,
          sender:
            userId,
          type:
            'like',
          referenceId:
            post._id,
          text:
            'Понравился ваш пост'
        });

      await emitNotification(
        req,
        notification
      );
    }

    res.json({
      success:
        true,

      isLiked:
        !isLiked,

      likes:
        updatedPost.likes || [],

      likesCount:
        (
          updatedPost.likes ||
          []
        ).length
    });
  } catch (error) {
    console.error(
      'Ошибка лайка:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// SAVE POST
// =========================================================

exports.toggleSave = async (
  req,
  res
) => {
  try {
    const postId =
      req.params.id;

    const userId =
      req.user._id;

    const post =
      await Post.findById(
        postId
      ).select(
        'savedBy'
      );

    if (!post) {
      return res.status(404).json({
        message:
          'Пост не найден'
      });
    }

    const isSaved =
      Array.isArray(
        post.savedBy
      ) &&
      post.savedBy.some(
        id =>
          sameId(
            id,
            userId
          )
      );

    const updatedPost =
      await Post.findByIdAndUpdate(
        postId,
        isSaved
          ? {
              $pull: {
                savedBy: userId
              }
            }
          : {
              $addToSet: {
                savedBy: userId
              }
            },
        {
          new: true,
          select:
            'savedBy'
        }
      );

    if (!updatedPost) {
      return res.status(404).json({
        message:
          'Пост не найден'
      });
    }

    res.json({
      success:
        true,

      isSaved:
        !isSaved,

      savedBy:
        updatedPost.savedBy || [],

      savedCount:
        (
          updatedPost.savedBy ||
          []
        ).length
    });
  } catch (error) {
    console.error(
      'Ошибка сохранения:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// ADD COMMENT
// =========================================================

exports.addComment = async (
  req,
  res
) => {
  try {
    const {
      text = ''
    } = req.body;

    const postId =
      req.params.id;

    const trimmed =
      text.trim();

    if (!trimmed) {
      return res.status(400).json({
        message:
          'Комментарий пустой'
      });
    }

    const newComment = {
      user:
        req.user._id,
      text:
        trimmed
    };

    const updatedPost =
      await Post.findByIdAndUpdate(
        postId,
        {
          $push: {
            comments:
              newComment
          }
        },
        {
          new: true
        }
      ).populate({
        path:
          'comments.user',
        select:
          'username avatar isVerified'
      });

    if (!updatedPost) {
      return res.status(404).json({
        message:
          'Пост не найден'
      });
    }

    const addedComment =
      updatedPost.comments[
        updatedPost.comments.length - 1
      ];

    if (
      !sameId(
        updatedPost.user,
        req.user._id
      )
    ) {
      const notification =
        await Notification.create({
          recipient:
            updatedPost.user,
          sender:
            req.user._id,
          type:
            'comment',
          referenceId:
            updatedPost._id,
          text:
            `Комментарий: "${trimmed.substring(
              0,
              30
            )}${
              trimmed.length > 30
                ? '...'
                : ''
            }"`
        });

      await emitNotification(
        req,
        notification
      );
    }

    res.status(201).json(
      addedComment
    );
  } catch (error) {
    console.error(
      'Ошибка добавления комментария:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// LIKE COMMENT
// =========================================================

exports.toggleCommentLike =
  async (
    req,
    res
  ) => {
    try {
      const {
        postId,
        commentId
      } = req.params;

      const userId =
        req.user._id;

      const post =
        await Post.findById(
          postId
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Пост не найден'
        });
      }

      const comment =
        post.comments.id(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          message:
            'Комментарий не найден'
        });
      }

      const isLiked =
        Array.isArray(
          comment.likes
        ) &&
        comment.likes.some(
          id =>
            sameId(
              id,
              userId
            )
        );

      await Post.updateOne(
        {
          _id: postId,
          'comments._id':
            commentId
        },
        isLiked
          ? {
              $pull: {
                'comments.$.likes':
                  userId
              }
            }
          : {
              $addToSet: {
                'comments.$.likes':
                  userId
              }
            }
      );

      const updatedPost =
        await Post.findById(
          postId
        ).populate(
          'comments.user comments.replies.user',
          'username avatar isVerified'
        );

      const updatedComment =
        updatedPost.comments.id(
          commentId
        );

      res.json({
        success:
          true,
        isLiked:
          !isLiked,
        comment:
          updatedComment
      });
    } catch (error) {
      console.error(
        'Ошибка лайка комментария:',
        error
      );

      res.status(500).json({
        message: error.message
      });
    }
  };


// =========================================================
// ADD REPLY
// =========================================================

exports.addCommentReply =
  async (
    req,
    res
  ) => {
    try {
      const {
        postId,
        commentId
      } = req.params;

      const {
        text = ''
      } = req.body;

      const trimmed =
        text.trim();

      if (!trimmed) {
        return res.status(400).json({
          message:
            'Ответ пустой'
        });
      }

      const newReply = {
        user:
          req.user._id,
        text:
          trimmed
      };

      const updatedPost =
        await Post.findOneAndUpdate(
          {
            _id: postId,
            'comments._id':
              commentId
          },
          {
            $push: {
              'comments.$.replies':
                newReply
            }
          },
          {
            new: true
          }
        ).populate(
          'comments.user comments.replies.user',
          'username avatar isVerified'
        );

      if (!updatedPost) {
        return res.status(404).json({
          message:
            'Пост или комментарий не найден'
        });
      }

      const parentComment =
        updatedPost.comments.id(
          commentId
        );

      const addedReply =
        parentComment.replies[
          parentComment.replies.length - 1
        ];

      res.status(201).json({
        success:
          true,
        reply:
          addedReply,
        commentId
      });
    } catch (error) {
      console.error(
        'Ошибка добавления ответа:',
        error
      );

      res.status(500).json({
        message: error.message
      });
    }
  };


// =========================================================
// EDIT COMMENT / REPLY
// =========================================================

exports.editComment =
  async (
    req,
    res
  ) => {
    try {
      const {
        postId,
        commentId
      } = req.params;

      const {
        text = '',
        isReply = false
      } = req.body;

      const trimmed =
        text.trim();

      if (!trimmed) {
        return res.status(400).json({
          message:
            'Текст не может быть пустым'
        });
      }

      const post =
        await Post.findById(
          postId
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Пост не найден'
        });
      }

      let targetComment =
        null;

      if (isReply) {
        for (
          const comment
          of post.comments
        ) {
          const reply =
            comment.replies.id(
              commentId
            );

          if (reply) {
            targetComment =
              reply;
            break;
          }
        }
      } else {
        targetComment =
          post.comments.id(
            commentId
          );
      }

      if (!targetComment) {
        return res.status(404).json({
          message:
            isReply
              ? 'Ответ не найден'
              : 'Комментарий не найден'
        });
      }

      if (
        !sameId(
          targetComment.user,
          req.user._id
        ) &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          message:
            'Вы не можете редактировать чужой комментарий'
        });
      }

      targetComment.text =
        trimmed;

      await post.save();

      await post.populate(
        'comments.user comments.replies.user',
        'username avatar isVerified'
      );

      let updatedComment =
        null;

      if (isReply) {
        for (
          const comment
          of post.comments
        ) {
          const reply =
            comment.replies.id(
              commentId
            );

          if (reply) {
            updatedComment =
              reply;
            break;
          }
        }
      } else {
        updatedComment =
          post.comments.id(
            commentId
          );
      }

      res.json({
        success:
          true,
        comment:
          updatedComment
      });
    } catch (error) {
      console.error(
        'Ошибка редактирования:',
        error
      );

      res.status(500).json({
        message: error.message
      });
    }
  };


// =========================================================
// DELETE COMMENT / REPLY
// =========================================================

exports.deleteComment =
  async (
    req,
    res
  ) => {
    try {
      const {
        postId,
        commentId
      } = req.params;

      const {
        isReply = false
      } = req.body;

      const post =
        await Post.findById(
          postId
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Пост не найден'
        });
      }

      if (isReply) {

        let parentComment =
          null;

        let reply =
          null;

        for (
          const comment
          of post.comments
        ) {
          const found =
            comment.replies.id(
              commentId
            );

          if (found) {
            parentComment =
              comment;

            reply =
              found;

            break;
          }
        }

        if (
          !reply ||
          !parentComment
        ) {
          return res.status(404).json({
            message:
              'Ответ не найден'
          });
        }

        if (
          !sameId(
            reply.user,
            req.user._id
          ) &&
          !req.user.isAdmin
        ) {
          return res.status(403).json({
            message:
              'Вы не можете удалить чужой ответ'
          });
        }

        parentComment.replies.pull(
          commentId
        );

      } else {

        const comment =
          post.comments.id(
            commentId
          );

        if (!comment) {
          return res.status(404).json({
            message:
              'Комментарий не найден'
          });
        }

        if (
          !sameId(
            comment.user,
            req.user._id
          ) &&
          !req.user.isAdmin
        ) {
          return res.status(403).json({
            message:
              'Вы не можете удалить чужой комментарий'
          });
        }

        post.comments.pull(
          commentId
        );
      }

      await post.save();

      res.json({
        success:
          true
      });
    } catch (error) {
      console.error(
        'Ошибка удаления:',
        error
      );

      res.status(500).json({
        message: error.message
      });
    }
  };


// =========================================================
// UPDATE POST
// =========================================================

exports.updatePost =
  async (
    req,
    res
  ) => {
    try {
      const post =
        await Post.findById(
          req.params.id
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Пост не найден'
        });
      }

      if (
        !sameId(
          post.user,
          req.user._id
        ) &&
        !req.user.isAdmin
      ) {
        return res.status(403).json({
          message:
            'Нет прав для редактирования'
        });
      }

      const {
        content
      } = req.body;

      if (
        content !== undefined
      ) {
        post.content =
          content;
      }

      if (req.file) {
        const b64 =
          Buffer
            .from(req.file.buffer)
            .toString('base64');

        const dataURI =
          `data:${req.file.mimetype};base64,${b64}`;

        const result =
          await cloudinary.uploader.upload(
            dataURI,
            {
              folder:
                'lume_posts',
              resource_type:
                'auto'
            }
          );

        post.mediaUrl =
          result.secure_url;

        post.mediaType =
          result.resource_type ===
          'video'
            ? 'video'
            : 'image';
      }

      await post.save();

      await post.populate([
        {
          path:
            'user',
          select:
            'username avatar isVerified'
        },
        {
          path:
            'comments.user',
          select:
            'username avatar isVerified'
        },
        {
          path:
            'comments.replies.user',
          select:
            'username avatar isVerified'
        }
      ]);

      res.json(
        getProcessedPost(
          post,
          req.user._id
        )
      );
    } catch (error) {
      console.error(
        'Ошибка обновления поста:',
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };


// =========================================================
// DELETE POST
// =========================================================

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    console.log('================================');
    console.log('DELETE POST HIT');
    console.log('METHOD:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('POST ID:', postId);
    console.log('USER ID:', req.user?._id?.toString());

    const post = await Post.findById(postId);

    console.log(
      'POST FOUND:',
      post
        ? {
            _id: post._id.toString(),
            user: post.user.toString()
          }
        : null
    );

    if (!post) {
      console.log('❌ POST NOT FOUND');

      return res.status(404).json({
        message: 'Пост не найден',
        postId
      });
    }

    if (
      post.user.toString() !==
        req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      console.log('❌ NO PERMISSION');

      return res.status(403).json({
        message:
          'Нет прав для удаления этого поста'
      });
    }

    await post.deleteOne();

    console.log('✅ POST DELETED:', postId);
    console.log('================================');

    res.json({
      success: true,
      message: 'Пост удалён',
      postId
    });

  } catch (error) {
    console.error(
      '❌ DELETE POST ERROR:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};