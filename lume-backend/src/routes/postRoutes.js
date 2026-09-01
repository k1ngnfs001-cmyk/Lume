const express = require('express');

const router = express.Router();

const {
  createPost,
  getFeed,
  getFollowingPosts,
  getPostById,
  toggleLike,
  toggleSave,
  sharePost,
  addComment,
  toggleCommentLike,
  addCommentReply,
  editComment,
  deleteComment,
  updatePost,
  deletePost,
} = require('../controllers/postController');

const auth = require('../middleware/auth');


// =========================================================
// POSTS
// =========================================================

router.post(
  '/',
  auth,
  createPost
);

router.get(
  '/',
  auth,
  getFeed
);

router.get(
  '/following',
  auth,
  getFollowingPosts
);


// =========================================================
// SINGLE POST
// =========================================================

router.get(
  '/:id',
  auth,
  getPostById
);


// =========================================================
// LIKE
// =========================================================

router.post(
  '/:id/like',
  auth,
  toggleLike
);


// =========================================================
// SAVE
// =========================================================

router.post(
  '/:id/save',
  auth,
  toggleSave
);


// =========================================================
// SHARE
// =========================================================

router.post(
  '/:id/share',
  auth,
  sharePost
);


// =========================================================
// COMMENTS
// =========================================================

router.post(
  '/:id/comments',
  auth,
  addComment
);

router.post(
  '/:postId/comments/:commentId/like',
  auth,
  toggleCommentLike
);

router.post(
  '/:postId/comments/:commentId/reply',
  auth,
  addCommentReply
);

router.put(
  '/:postId/comments/:commentId',
  auth,
  editComment
);

router.delete(
  '/:postId/comments/:commentId',
  auth,
  deleteComment
);


// =========================================================
// UPDATE / DELETE POST
// =========================================================

router.put(
  '/:id',
  auth,
  updatePost
);

router.delete(
  '/:id',
  auth,
  deletePost
);


module.exports = router;