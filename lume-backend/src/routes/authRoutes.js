const express = require('express');

const router =
  express.Router();

const {
  register,
  login,
  verifyOtp,
  getMe
} = require(
  '../controllers/authController'
);

const {
  protect
} = require(
  '../middleware/authMiddleware'
);


// =========================================================
// REGISTER
// =========================================================

router.post(
  '/register',
  register
);


// =========================================================
// LOGIN
// =========================================================

router.post(
  '/login',
  login
);


// =========================================================
// VERIFY OTP
// =========================================================

router.post(
  '/verify-otp',
  verifyOtp
);


// =========================================================
// CURRENT USER
// =========================================================

router.get(
  '/me',
  protect,
  getMe
);


module.exports =
  router;