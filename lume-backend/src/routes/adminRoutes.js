const express = require('express');

const router =
  express.Router();

const {
  getAllUsers,
  getAllPosts,
  deletePost,
  deleteUser,
  toggleVerify,
  updateUser,
  updatePost,
  getPostComments,
  updateComment,
  deleteComment,
  toggleBan
} = require(
  '../controllers/adminController'
);

const {
  protect,
  isAdmin
} = require(
  '../middleware/authMiddleware'
);


// =========================================================
// USERS
// =========================================================

router.get(
  '/users',
  protect,
  isAdmin,
  getAllUsers
);


// =========================================================
// POSTS
// =========================================================

router.get(
  '/posts',
  protect,
  isAdmin,
  getAllPosts
);


// =========================================================
// DELETE POST
// =========================================================

router.delete(
  '/posts/:id',
  protect,
  isAdmin,
  deletePost
);


// =========================================================
// DELETE USER
// =========================================================

router.delete(
  '/users/:id',
  protect,
  isAdmin,
  deleteUser
);


// =========================================================
// VERIFY
// =========================================================

router.put(
  '/verify/:id',
  protect,
  isAdmin,
  toggleVerify
);


// =========================================================
// UPDATE USER
// =========================================================

router.put(
  '/users/:id',
  protect,
  isAdmin,
  updateUser
);


// =========================================================
// UPDATE POST
// =========================================================

router.put(
  '/posts/:id',
  protect,
  isAdmin,
  updatePost
);


// =========================================================
// COMMENTS
// =========================================================

router.get(
  '/posts/:id/comments',
  protect,
  isAdmin,
  getPostComments
);

router.put(
  '/comments/:id',
  protect,
  isAdmin,
  updateComment
);

router.delete(
  '/comments/:id',
  protect,
  isAdmin,
  deleteComment
);


// =========================================================
// BAN / UNBAN
// =========================================================

router.put(
  '/ban/:id',
  protect,
  isAdmin,
  toggleBan
);


module.exports =
  router;