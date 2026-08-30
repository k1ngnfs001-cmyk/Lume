const express =
  require('express');

const router =
  express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} =
  require(
    '../controllers/notificationController'
  );

const {
  protect
} =
  require(
    '../middleware/authMiddleware'
  );


// =========================================================
// GET ALL
// =========================================================

router.get(
  '/',
  protect,
  getMyNotifications
);


// =========================================================
// MARK ONE
// =========================================================

router.put(
  '/:id/read',
  protect,
  markAsRead
);


// =========================================================
// MARK ALL
// =========================================================

router.put(
  '/read',
  protect,
  markAllAsRead
);


module.exports =
  router;