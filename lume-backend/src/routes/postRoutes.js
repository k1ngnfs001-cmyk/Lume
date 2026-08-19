const express = require('express');
const router = express.Router();

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
} = require('../controllers/postController');

const {
  protect,
} = require('../middleware/authMiddleware');

const upload =
  require('../middleware/uploadMiddleware');


// =========================================================
// POSTS
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
// FOLLOWING FEED
// =========================================================

router.get(
  '/following',
  protect,
  getFollowingPosts
);


// =========================================================
// LIKE / SAVE
// =========================================================

router.post(
  '/:id/like',
  protect,
  toggleLike
);

router.post(
  '/:id/save',
  protect,
  toggleSave
);


// =========================================================
// COMMENTS
// =========================================================

router.post(
  '/:id/comment',
  protect,
  addComment
);

router.post(
  '/:postId/comments/:commentId/like',
  protect,
  toggleCommentLike
);

router.post(
  '/:postId/comments/:commentId/reply',
  protect,
  addCommentReply
);

router.put(
  '/:postId/comments/:commentId',
  protect,
  editComment
);

router.delete(
  '/:postId/comments/:commentId',
  protect,
  deleteComment
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


module.exports = router;