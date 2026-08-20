const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

// =========================================================
// HELPER
// =========================================================

const sameId = (a, b) => {
  if (!a || !b) return false;

  return a.toString() === b.toString();
};


// =========================================================
// GET USER PROFILE
// =========================================================

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const posts = await Post.find({
      user: user._id
    })
      .sort({ createdAt: -1 })
      .populate(
        'user',
        'username displayName avatar isVerified'
      )
      .populate(
        'comments.user',
        'username displayName avatar isVerified'
      )
      .populate(
        'comments.replies.user',
        'username displayName avatar isVerified'
      );

    const isFollowing =
      Array.isArray(user.followers) &&
      user.followers.some((id) =>
        sameId(id, req.user._id)
      );

    res.json({
      user,
      posts,
      isFollowing:
        sameId(req.user._id, req.params.id)
          ? null
          : isFollowing
    });

  } catch (error) {
    console.error(
      'Ошибка получения профиля:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// UPDATE PROFILE
// =========================================================

exports.updateProfile = async (req, res) => {
  try {
    console.log('====================================');
    console.log('UPDATE PROFILE REQUEST');
    console.log('USER ID:', req.user?._id?.toString());
    console.log('BODY:', req.body);

    console.log(
      'FILE:',
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size
          }
        : null
    );

    console.log('====================================');

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const {
      displayName,
      username,
      bio
    } = req.body;

    // -------------------------------------------------------
    // USERNAME
    // -------------------------------------------------------

    if (
      username !== undefined &&
      username.trim() !== '' &&
      username !== user.username
    ) {
      const existingUser =
        await User.findOne({
          username: username.trim()
        });

      if (
        existingUser &&
        !sameId(
          existingUser._id,
          user._id
        )
      ) {
        return res.status(400).json({
          message:
            'Это имя пользователя уже занято!'
        });
      }

      user.username =
        username.trim();
    }

    // -------------------------------------------------------
    // DISPLAY NAME
    // -------------------------------------------------------

    if (displayName !== undefined) {
      user.displayName =
        displayName.trim();
    }

    // -------------------------------------------------------
    // BIO
    // -------------------------------------------------------

    if (bio !== undefined) {
      user.bio = bio;
    }

    // -------------------------------------------------------
    // AVATAR UPLOAD
    // -------------------------------------------------------

    if (!req.file) {
      console.log(
        '❌ AVATAR FILE NOT RECEIVED'
      );
    } else {
      console.log(
        '✅ AVATAR FILE RECEIVED'
      );

      console.log(
        'Filename:',
        req.file.originalname
      );

      console.log(
        'Mimetype:',
        req.file.mimetype
      );

      console.log(
        'Size:',
        req.file.size
      );

      // Buffer -> Base64
      const base64 =
        Buffer
          .from(req.file.buffer)
          .toString('base64');

      const dataUri =
        `data:${req.file.mimetype};base64,${base64}`;

      console.log(
        '☁️ Uploading avatar to Cloudinary...'
      );

      const result =
        await cloudinary.uploader.upload(
          dataUri,
          {
            folder: 'lume_avatars',
            resource_type: 'image'
          }
        );

      console.log(
        '✅ CLOUDINARY UPLOAD SUCCESS'
      );

      console.log(
        'Public ID:',
        result.public_id
      );

      console.log(
        'Secure URL:',
        result.secure_url
      );

      // Save Cloudinary URL to MongoDB
      user.avatar =
        result.secure_url;

      console.log(
        'NEW USER AVATAR:',
        user.avatar
      );
    }

    // -------------------------------------------------------
    // SAVE USER
    // -------------------------------------------------------

    await user.save();

    console.log(
      '✅ USER SAVED TO DATABASE'
    );

    console.log(
      'DATABASE AVATAR:',
      user.avatar
    );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    const responseData = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || '',
      bio: user.bio,
      email: user.email,
      followers: user.followers || [],
      following: user.following || [],
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      isBanned: user.isBanned
    };

    console.log(
      'FINAL RESPONSE:',
      responseData
    );

    console.log('====================================');

    res.json(responseData);

  } catch (error) {
    console.error(
      '❌ UPDATE PROFILE ERROR:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// TOGGLE FOLLOW
// =========================================================

exports.toggleFollow = async (req, res) => {
  try {
    const targetUser =
      await User.findById(
        req.params.id
      );

    const currentUser =
      await User.findById(
        req.user._id
      );

    if (!targetUser) {
      return res.status(404).json({
        message:
          'Пользователь не найден'
      });
    }

    if (
      sameId(
        targetUser._id,
        req.user._id
      )
    ) {
      return res.status(400).json({
        message:
          'Нельзя подписаться на себя'
      });
    }

    const isFollowing =
      Array.isArray(
        targetUser.followers
      ) &&
      targetUser.followers.some(
        (id) =>
          sameId(
            id,
            req.user._id
          )
      );

    if (isFollowing) {
      // Remove follower
      targetUser.followers =
        targetUser.followers.filter(
          (id) =>
            !sameId(
              id,
              req.user._id
            )
        );

      // Remove following
      currentUser.following =
        currentUser.following.filter(
          (id) =>
            !sameId(
              id,
              targetUser._id
            )
        );

    } else {
      // Add follower
      const alreadyFollower =
        targetUser.followers.some(
          (id) =>
            sameId(
              id,
              req.user._id
            )
        );

      if (!alreadyFollower) {
        targetUser.followers.push(
          req.user._id
        );
      }

      // Add following
      const alreadyFollowing =
        currentUser.following.some(
          (id) =>
            sameId(
              id,
              targetUser._id
            )
        );

      if (!alreadyFollowing) {
        currentUser.following.push(
          targetUser._id
        );
      }

      // -----------------------------------------------------
      // Notification
      // -----------------------------------------------------

      const notification =
        await Notification.create({
          recipient:
            targetUser._id,

          sender:
            req.user._id,

          type:
            'follow',

          referenceId:
            currentUser._id,

          text:
            `${
              currentUser.displayName ||
              currentUser.username
            } подписался на вас`
        });

      const populatedNotif =
        await notification.populate(
          'sender',
          'username avatar'
        );

      const io =
        req.app.get('io');

      if (io) {
        io.to(
          targetUser._id.toString()
        ).emit(
          'new_notification',
          populatedNotif
        );
      }
    }

    await targetUser.save();
    await currentUser.save();

    res.json({
      isFollowing:
        !isFollowing
    });

  } catch (error) {
    console.error(
      'Ошибка подписки:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// =========================================================
// GET FOLLOWING
// =========================================================

exports.getFollowing = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).populate(
        'following',
        'username avatar displayName isVerified'
      );

    if (!user) {
      return res.status(404).json({
        message:
          'Пользователь не найден'
      });
    }

    res.json(
      user.following || []
    );

  } catch (error) {
    console.error(
      'Ошибка загрузки following:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};