const express = require('express');

const router =
  express.Router();

const {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  toggleSave,
  getFollowingPosts,
  updatePost,
  toggleCommentLike,
  addCommentReply,
  editComment,
  deleteComment,
  deletePost
} = require('../controllers/postController');

const {
  protect
} = require('../middleware/authMiddleware');

const upload =
  require('../middleware/uploadMiddleware');


// =========================================================
// CREATE / GET POSTS
// =========================================================

router
  .route('/')
  .post(
    protect,
    upload.single('media'),
    createPost
  )
  .get(
    protect,
    getFeed
  );


// =========================================================
// FOLLOWING
// =========================================================

router.get(
  '/following',
  protect,
  getFollowingPosts
);


// =========================================================
// LIKE
// =========================================================

router.post(
  '/:id/like',
  protect,
  toggleLike
);


// =========================================================
// SAVE
// =========================================================

router.post(
  '/:id/save',
  protect,
  toggleSave
);


// =========================================================
// ADD COMMENT
// =========================================================

router.post(
  '/:id/comment',
  protect,
  addComment
);


// =========================================================
// UPDATE POST
// =========================================================

router.put(
  '/:id',
  protect,
  upload.single('media'),
  updatePost
);


// =========================================================
// DELETE POST
// =========================================================

router.delete(
  '/:id',
  protect,
  deletePost
);


// =========================================================
// COMMENT LIKE
// =========================================================

router.post(
  '/:postId/comments/:commentId/like',
  protect,
  toggleCommentLike
);


// =========================================================
// REPLY
// =========================================================

router.post(
  '/:postId/comments/:commentId/reply',
  protect,
  addCommentReply
);


// =========================================================
// EDIT COMMENT
// =========================================================

router.put(
  '/:postId/comments/:commentId',
  protect,
  editComment
);


// =========================================================
// DELETE COMMENT
// =========================================================

router.delete(
  '/:postId/comments/:commentId',
  protect,
  deleteComment
);


module.exports =
  router;