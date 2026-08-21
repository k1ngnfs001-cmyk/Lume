const User = require('../models/User');
const Post = require('../models/Post');


// =========================================================
// GET ALL USERS
// =========================================================

exports.getAllUsers = async (
  req,
  res
) => {
  try {

    const users =
      await User.find()
        .select('-password')
        .sort({
          createdAt: -1
        });

    res.json(users);

  } catch (error) {

    console.error(
      'Ошибка загрузки пользователей:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};


// =========================================================
// GET ALL POSTS
// =========================================================

exports.getAllPosts = async (
  req,
  res
) => {
  try {

    const posts =
      await Post.find()
        .populate(
          'user',
          'username avatar isVerified'
        )
        .sort({
          createdAt: -1
        });

    res.json(posts);

  } catch (error) {

    console.error(
      'Ошибка загрузки постов:',
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

exports.deletePost = async (
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

    await post.deleteOne();

    res.json({
      success:
        true,

      message:
        'Пост удалён'
    });

  } catch (error) {

    console.error(
      'Ошибка удаления поста:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};


// =========================================================
// DELETE USER
// =========================================================

exports.deleteUser = async (
  req,
  res
) => {
  try {

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        message:
          'Пользователь не найден'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        message:
          'Нельзя удалить администратора!'
      });
    }

    const io =
      req.app.get('io');

    const userRoom =
      user._id.toString();

    // Online userga event
    if (io) {

      io.to(
        userRoom
      ).emit(
        'account-deleted',
        {
          message:
            'Ваш аккаунт был удалён администратором',

          code:
            'ACCOUNT_DELETED'
        }
      );

      console.log(
        '🗑 account-deleted sent:',
        userRoom
      );
    }

    await Post.deleteMany({
      user:
        user._id
    });

    await user.deleteOne();

    res.json({
      success:
        true,

      message:
        'Пользователь и его посты удалены'
    });

  } catch (error) {

    console.error(
      'Ошибка удаления пользователя:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};


// =========================================================
// TOGGLE VERIFY
// =========================================================

exports.toggleVerify = async (
  req,
  res
) => {
  try {

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        message:
          'Пользователь не найден'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        message:
          'Нельзя верифицировать администратора'
      });
    }

    user.isVerified =
      !user.isVerified;

    await user.save();

    res.json({

      _id:
        user._id,

      username:
        user.username,

      isVerified:
        user.isVerified

    });

  } catch (error) {

    console.error(
      'Ошибка верификации:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};


// =========================================================
// UPDATE USER
// =========================================================

exports.updateUser = async (
  req,
  res
) => {
  try {

    const {
      username,
      bio,
      avatar,
      role,
      isVerified
    } = req.body;

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        message:
          'Пользователь не найден'
      });
    }

    if (
      user.isAdmin &&
      req.params.id !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          'Нельзя редактировать другого администратора'
      });
    }

    if (
      username &&
      username !==
        user.username
    ) {

      const existing =
        await User.findOne({
          username
        });

      if (
        existing &&
        existing._id.toString() !==
          user._id.toString()
      ) {

        return res.status(400).json({
          message:
            'Это имя пользователя уже занято'
        });
      }

      user.username =
        username;
    }

    if (
      bio !== undefined
    ) {
      user.bio =
        bio;
    }

    if (
      avatar !== undefined
    ) {
      user.avatar =
        avatar;
    }

    if (
      role &&
      !user.isAdmin
    ) {
      user.role =
        role;
    }

    if (
      isVerified !== undefined
    ) {
      user.isVerified =
        isVerified;
    }

    await user.save();

    res.json({

      _id:
        user._id,

      username:
        user.username,

      displayName:
        user.displayName,

      email:
        user.email,

      avatar:
        user.avatar,

      bio:
        user.bio,

      isAdmin:
        user.isAdmin,

      isVerified:
        user.isVerified,

      isBanned:
        user.isBanned

    });

  } catch (error) {

    console.error(
      'Ошибка обновления пользователя:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};


// =========================================================
// UPDATE POST
// =========================================================

exports.updatePost = async (
  req,
  res
) => {
  try {

    const {
      content
    } = req.body;

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
      content !== undefined
    ) {
      post.content =
        content;
    }

    await post.save();

    const updatedPost =
      await post.populate(
        'user',
        'username avatar'
      );

    res.json(
      updatedPost
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
// GET POST COMMENTS
// =========================================================

exports.getPostComments =
  async (
    req,
    res
  ) => {
    try {

      const post =
        await Post.findById(
          req.params.id
        ).populate(
          'comments.user',
          'username avatar'
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Пост не найден'
        });
      }

      res.json(
        post.comments
      );

    } catch (error) {

      console.error(
        'Ошибка загрузки комментариев:',
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };


// =========================================================
// UPDATE COMMENT
// =========================================================

exports.updateComment =
  async (
    req,
    res
  ) => {
    try {

      const {
        text
      } = req.body;

      const post =
        await Post.findOne({
          'comments._id':
            req.params.id
        });

      if (!post) {
        return res.status(404).json({
          message:
            'Комментарий не найден'
        });
      }

      const comment =
        post.comments.id(
          req.params.id
        );

      if (!comment) {
        return res.status(404).json({
          message:
            'Комментарий не найден'
        });
      }

      if (
        text !== undefined
      ) {
        comment.text =
          text;
      }

      await post.save();

      await post.populate(
        'comments.user',
        'username avatar'
      );

      res.json(
        post.comments.id(
          req.params.id
        )
      );

    } catch (error) {

      console.error(
        'Ошибка обновления комментария:',
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };


// =========================================================
// DELETE COMMENT
// =========================================================

exports.deleteComment =
  async (
    req,
    res
  ) => {
    try {

      const post =
        await Post.findOne({
          'comments._id':
            req.params.id
        });

      if (!post) {
        return res.status(404).json({
          message:
            'Комментарий не найден'
        });
      }

      const comment =
        post.comments.id(
          req.params.id
        );

      if (!comment) {
        return res.status(404).json({
          message:
            'Комментарий не найден'
        });
      }

      comment.deleteOne();

      await post.save();

      res.json({
        success:
          true,

        message:
          'Комментарий удалён'
      });

    } catch (error) {

      console.error(
        'Ошибка удаления комментария:',
        error
      );

      res.status(500).json({
        message:
          error.message
      });
    }
  };


// =========================================================
// BAN / UNBAN
// =========================================================

exports.toggleBan = async (
  req,
  res
) => {

  try {

    const targetUser =
      await User.findById(
        req.params.id
      );

    if (!targetUser) {

      return res.status(404).json({
        message:
          'Пользователь не найден'
      });

    }


    // -------------------------------------------------------
    // ADMIN PROTECTION
    // -------------------------------------------------------

    if (
      targetUser.isAdmin
    ) {

      return res.status(400).json({
        message:
          'Нельзя заблокировать администратора'
      });

    }


    // -------------------------------------------------------
    // SELF PROTECTION
    // -------------------------------------------------------

    if (
      targetUser._id.toString() ===
      req.user._id.toString()
    ) {

      return res.status(400).json({
        message:
          'Нельзя заблокировать самого себя'
      });

    }


    // -------------------------------------------------------
    // TOGGLE
    // -------------------------------------------------------

    targetUser.isBanned =
      !targetUser.isBanned;

    await targetUser.save();


    const io =
      req.app.get('io');

    const userId =
      targetUser._id.toString();


    // =======================================================
    // BAN
    // =======================================================

    if (
      targetUser.isBanned
    ) {

      console.log(
        '=========================================='
      );

      console.log(
        '🚫 USER BAN START'
      );

      console.log(
        'USERNAME:',
        targetUser.username
      );

      console.log(
        'USER ID:',
        userId
      );


      if (!io) {

        console.error(
          '❌ Socket.io instance topilmadi'
        );

      } else {

        // ---------------------------------------------------
        // ROOM EVENT
        // ---------------------------------------------------

        io.to(
          userId
        ).emit(
          'user-banned',
          {
            message:
              'Ваш аккаунт был заблокирован администратором',

            code:
              'USER_BANNED'
          }
        );

        console.log(
          '✅ ROOM EVENT SENT:',
          userId
        );


        // ---------------------------------------------------
        // DIRECT SOCKET SEARCH
        // ---------------------------------------------------

        let matchedSockets =
          0;

        io.sockets.sockets.forEach(
          (socket) => {

            const socketUserId =
              socket.userId
                ? socket.userId.toString()
                : '';

            console.log(
              '🔎 SOCKET CHECK:',
              socket.id,
              socketUserId
            );


            if (
              socketUserId ===
              userId
            ) {

              matchedSockets++;

              // Direct event
              socket.emit(
                'user-banned',
                {
                  message:
                    'Ваш аккаунт был заблокирован администратором',

                  code:
                    'USER_BANNED'
                }
              );

              console.log(
                '✅ DIRECT EVENT SENT:',
                socket.id
              );


              // Socketni darhol emas,
              // 1.5 sec keyin uzamiz.
              setTimeout(
                () => {

                  if (
                    socket.connected
                  ) {

                    socket.disconnect(
                      true
                    );

                    console.log(
                      '🔴 SOCKET DISCONNECTED AFTER BAN:',
                      socket.id
                    );

                  }

                },
                1500
              );

            }

          }
        );


        console.log(
          '🎯 MATCHED SOCKETS:',
          matchedSockets
        );

      }


      console.log(
        '=========================================='
      );

    }


    // =======================================================
    // UNBAN
    // =======================================================

    else {

      console.log(
        '✅ USER UNBANNED:',
        targetUser.username
      );

    }


    // =======================================================
    // RESPONSE
    // =======================================================

    res.json({

      _id:
        targetUser._id,

      username:
        targetUser.username,

      isBanned:
        targetUser.isBanned

    });

  } catch (error) {

    console.error(
      '❌ Ошибка бана/разбана:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });
  }
};