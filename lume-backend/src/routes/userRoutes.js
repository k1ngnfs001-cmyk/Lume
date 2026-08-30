const express =
  require('express');

const router =
  express.Router();


const {
  getUserProfile,
  shareProfile,
  updateProfile,
  toggleFollow,
  getFollowing
} =
  require(
    '../controllers/userController'
  );


const {
  protect
} =
  require(
    '../middleware/authMiddleware'
  );


const upload =
  require(
    '../middleware/uploadMiddleware'
  );


// =========================================================
// GET USER PROFILE
//
// /api/users/profile/:id
// =========================================================

router.get(
  '/profile/:id',
  protect,
  getUserProfile
);


// =========================================================
// SHARE PROFILE
//
// /api/users/profile/:id/share
// =========================================================

router.post(
  '/profile/:id/share',
  protect,
  shareProfile
);


// =========================================================
// UPDATE PROFILE
//
// /api/users/update
// =========================================================

router.put(
  '/update',
  protect,
  upload.single('avatar'),
  updateProfile
);


// =========================================================
// FOLLOW / UNFOLLOW
//
// /api/users/follow/:id
// =========================================================

router.post(
  '/follow/:id',
  protect,
  toggleFollow
);


// =========================================================
// GET FOLLOWING
//
// /api/users/following
// =========================================================

router.get(
  '/following',
  protect,
  getFollowing
);


module.exports =
  router;