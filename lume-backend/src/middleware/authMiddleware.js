const jwt = require('jsonwebtoken');
const User = require('../models/User');


// =========================================================
// PROTECT
// =========================================================

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Authorization: Bearer TOKEN
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token =
        req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Не авторизован, токен отсутствует'
      });
    }

    // -------------------------------------------------------
    // Verify JWT
    // -------------------------------------------------------

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (jwtError) {
      return res.status(401).json({
        message: 'Недействительный или истёкший токен'
      });
    }

    // -------------------------------------------------------
    // Find user
    // -------------------------------------------------------

    const user =
      await User.findById(
        decoded.id
      ).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Пользователь не найден'
      });
    }

    // -------------------------------------------------------
    // BAN CHECK
    // -------------------------------------------------------

    if (user.isBanned) {
      return res.status(403).json({
        message:
          'Ваш аккаунт заблокирован администратором',
        code: 'USER_BANNED'
      });
    }

    // -------------------------------------------------------
    // Attach user
    // -------------------------------------------------------

    req.user = user;

    next();

  } catch (error) {
    console.error(
      'Ошибка auth middleware:',
      error
    );

    return res.status(500).json({
      message:
        'Ошибка авторизации'
    });
  }
};


// =========================================================
// ADMIN CHECK
// =========================================================

exports.isAdmin = (
  req,
  res,
  next
) => {

  if (
    !req.user ||
    !req.user.isAdmin
  ) {
    return res.status(403).json({
      message:
        'Доступ разрешён только администраторам'
    });
  }

  next();
};