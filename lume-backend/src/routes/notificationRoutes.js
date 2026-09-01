const express = require('express');

const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const {
  protect,
} = require('../middleware/authMiddleware');


// =========================================================
// GET ALL NOTIFICATIONS
// =========================================================

router.get(
  '/',
  protect,
  getMyNotifications
);


// =========================================================
// MARK ONE AS READ
// =========================================================

router.put(
  '/:id/read',
  protect,
  markAsRead
);


// =========================================================
// MARK ALL AS READ
// =========================================================

router.put(
  '/read',
  protect,
  markAllAsRead
);


module.exports = router;