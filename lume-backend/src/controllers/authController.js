const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  sendOtpEmail
} = require('../config/email');


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
    // confirmPassword сюда не передаём.
    // Он НИКОГДА не сохраняется в MongoDB.

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
    // GENERATE OTP
    // -------------------------------------------------------

    const otp =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

    const otpExpiry =
      Date.now() +
      10 * 60 * 1000;


    user.otp =
      otp;

    user.otpExpiry =
      otpExpiry;


    await user.save();


    // -------------------------------------------------------
    // SEND OTP TO EMAIL
    // -------------------------------------------------------

    try {

      await sendOtpEmail(
        email,
        otp
      );

      console.log(
        `📧 OTP отправлен на ${email}`
      );

    } catch (emailError) {

      console.error(
        '❌ Ошибка отправки OTP:',
        emailError
      );

      // OTPni yaratilgan holatda qoldirmaymiz
      user.otp =
        undefined;

      user.otpExpiry =
        undefined;

      await user.save();

      return res.status(500).json({
        message:
          'Не удалось отправить код на email. Попробуйте позже.'
      });
    }


    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    res.json({
      message:
        'Код подтверждения отправлен на ваш email',

      requireOtp:
        true
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
// VERIFY OTP
// =========================================================

exports.verifyOtp = async (
  req,
  res
) => {

  const {
    email,
    otp
  } = req.body;

  try {

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findOne({
        email
      });

    if (!user) {
      return res.status(400).json({
        message:
          'Неверный или истекший код'
      });
    }


    // -------------------------------------------------------
    // BAN CHECK
    // -------------------------------------------------------

    if (
      user.isBanned === true
    ) {

      console.log(
        '🚫 Заблокированный пользователь пытается подтвердить OTP:',
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
    // OTP VALIDATION
    // -------------------------------------------------------

    const isOtpInvalid =
      !user.otp ||
      !user.otpExpiry ||
      user.otp !== otp ||
      Date.now() >
        user.otpExpiry;


    if (isOtpInvalid) {
      return res.status(400).json({
        message:
          'Неверный или истекший код'
      });
    }


    // -------------------------------------------------------
    // CLEAR OTP
    // -------------------------------------------------------

    user.otp =
      undefined;

    user.otpExpiry =
      undefined;


    await user.save();


    // -------------------------------------------------------
    // CREATE TOKEN
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
      'Ошибка проверки OTP:',
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