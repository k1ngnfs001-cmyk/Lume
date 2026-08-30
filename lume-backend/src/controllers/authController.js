const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Notification = require('../models/Notification');


// =========================================================
// TOKEN
// =========================================================

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};


// =========================================================
// ADMIN NOTIFICATION HELPER
// =========================================================

const notifyAdmins = async ({
  req,
  user,
  type,
  text
}) => {
  try {

    if (!user) {
      return;
    }

    const admins =
      await User.find({
        isAdmin: true
      }).select('_id');


    if (
      !admins ||
      admins.length === 0
    ) {
      return;
    }


    const io =
      req.app.get('io');


    for (
      const admin
      of admins
    ) {

      // -----------------------------------------------------
      // CREATE NOTIFICATION
      // -----------------------------------------------------

      const notification =
        await Notification.create({
          recipient:
            admin._id,

          sender:
            user._id,

          type,

          referenceId:
            user._id,

          text
        });


      // -----------------------------------------------------
      // POPULATE SENDER
      // -----------------------------------------------------

      const populatedNotification =
        await notification.populate(
          'sender',
          'username avatar'
        );


      // -----------------------------------------------------
      // REAL-TIME SOCKET
      // -----------------------------------------------------

      if (io) {

        io.to(
          admin._id.toString()
        ).emit(
          'new_notification',
          populatedNotification
        );

      }

    }

  } catch (error) {

    // Notification xatosi login yoki registerni
    // buzmasligi kerak.

    console.error(
      'Ошибка уведомления администраторов:',
      error
    );

  }
};


// =========================================================
// REGISTER
// =========================================================

exports.register = async (
  req,
  res
) => {

  const {
    username,
    email,
    password,
    confirmPassword
  } = req.body;


  try {

    // -------------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------------

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {

      return res.status(400).json({
        message:
          'Заполните все поля'
      });

    }


    // -------------------------------------------------------
    // CLEAN VALUES
    // -------------------------------------------------------

    const cleanUsername =
      username.trim();

    const cleanEmail =
      email.trim().toLowerCase();


    // -------------------------------------------------------
    // PASSWORD CONFIRMATION
    // -------------------------------------------------------

    if (
      password !==
      confirmPassword
    ) {

      return res.status(400).json({
        message:
          'Пароли не совпадают'
      });

    }


    // -------------------------------------------------------
    // PASSWORD LENGTH
    // -------------------------------------------------------

    if (
      password.length < 6
    ) {

      return res.status(400).json({
        message:
          'Пароль должен содержать минимум 6 символов'
      });

    }


    // -------------------------------------------------------
    // USERNAME CHECK
    // -------------------------------------------------------

    const usernameExists =
      await User.findOne({
        username:
          cleanUsername
      });


    if (usernameExists) {

      return res.status(400).json({
        message:
          'Это имя пользователя уже занято'
      });

    }


    // -------------------------------------------------------
    // EMAIL CHECK
    // -------------------------------------------------------

    const emailExists =
      await User.findOne({
        email:
          cleanEmail
      });


    if (emailExists) {

      return res.status(400).json({
        message:
          'Email уже зарегистрирован'
      });

    }


    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const user =
      await User.create({
        username:
          cleanUsername,

        email:
          cleanEmail,

        password
      });


    // =======================================================
    // NOTIFY ADMINS
    // =======================================================

    await notifyAdmins({
      req,

      user,

      type:
        'new_user',

      text:
        `@${user.username} зарегистрировался в Lume`
    });


    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    res.status(201).json({

      _id:
        user._id,

      username:
        user.username,

      email:
        user.email,

      displayName:
        user.displayName,

      avatar:
        user.avatar,

      bio:
        user.bio,

      isAdmin:
        user.isAdmin,

      isVerified:
        user.isVerified,

      isBanned:
        user.isBanned,

      token:
        generateToken(
          user._id
        )

    });

  } catch (error) {

    console.error(
      'Ошибка регистрации:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });

  }

};


// =========================================================
// LOGIN
// =========================================================

exports.login = async (
  req,
  res
) => {

  const {
    email,
    password
  } = req.body;


  try {

    // -------------------------------------------------------
    // REQUIRED
    // -------------------------------------------------------

    if (
      !email ||
      !password
    ) {

      return res.status(400).json({
        message:
          'Введите email и пароль'
      });

    }


    const cleanEmail =
      email.trim().toLowerCase();


    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findOne({
        email:
          cleanEmail
      }).select(
        '+password'
      );


    if (!user) {

      return res.status(401).json({
        message:
          'Неверный email или пароль'
      });

    }


    // -------------------------------------------------------
    // PASSWORD
    // -------------------------------------------------------

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!isMatch) {

      return res.status(401).json({
        message:
          'Неверный email или пароль'
      });

    }


    // -------------------------------------------------------
    // BAN CHECK
    // -------------------------------------------------------

    if (
      user.isBanned === true
    ) {

      console.log(
        '🚫 Заблокированный пользователь пытается войти:',
        user.username
      );


      return res.status(403).json({

        message:
          'Ваш аккаунт заблокирован администратором',

        code:
          'USER_BANNED'

      });

    }


    // =======================================================
    // ADMIN NOTIFICATION
    // =======================================================

    await notifyAdmins({

      req,

      user,

      type:
        'new_login',

      text:
        `@${user.username} вошёл в аккаунт`

    });


    // -------------------------------------------------------
    // TOKEN
    // -------------------------------------------------------

    const token =
      generateToken(
        user._id
      );


    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    res.json({

      _id:
        user._id,

      username:
        user.username,

      email:
        user.email,

      displayName:
        user.displayName,

      avatar:
        user.avatar,

      bio:
        user.bio,

      isAdmin:
        user.isAdmin,

      isVerified:
        user.isVerified,

      isBanned:
        user.isBanned,

      token

    });

  } catch (error) {

    console.error(
      'Ошибка входа:',
      error
    );

    res.status(500).json({
      message:
        error.message
    });

  }

};


// =========================================================
// GET ME
// =========================================================

exports.getMe = async (
  req,
  res
) => {

  try {

    const user =
      await User.findById(
        req.user._id
      ).select(
        '-password'
      );


    if (!user) {

      return res.status(404).json({
        message:
          'Пользователь не найден'
      });

    }


    // -------------------------------------------------------
    // BAN CHECK
    // -------------------------------------------------------

    if (
      user.isBanned === true
    ) {

      return res.status(403).json({

        message:
          'Ваш аккаунт заблокирован администратором',

        code:
          'USER_BANNED'

      });

    }


    res.json(
      user
    );

  } catch (error) {

    console.error(
      'Ошибка получения профиля:',
      error
    );

    res.status(500).json({
      message:
        'Ошибка получения профиля'
    });

  }

};