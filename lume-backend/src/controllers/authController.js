const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


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
    // EMAIL CHECK
    // -------------------------------------------------------

    const emailExists =
      await User.findOne({
        email
      });

    if (emailExists) {
      return res.status(400).json({
        message:
          'Email уже зарегистрирован'
      });
    }


    // -------------------------------------------------------
    // USERNAME CHECK
    // -------------------------------------------------------

    const usernameExists =
      await User.findOne({
        username
      });

    if (usernameExists) {
      return res.status(400).json({
        message:
          'Это имя пользователя уже занято'
      });
    }


    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const user =
      await User.create({
        username,
        email,
        password
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
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findOne({
        email
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
    // PASSWORD CHECK
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


    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    const token =
      generateToken(
        user._id
      );


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


    res.json(user);

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