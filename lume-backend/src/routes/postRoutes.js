const express =
  require('express');

const router =
  express.Router();


// =========================================================
// CONTROLLERS
// =========================================================

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
  deletePost,
  getPostById,
  sharePost
} =
  require(
    '../controllers/postController'
  );


// =========================================================
// MIDDLEWARE
// =========================================================

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
// DEBUG
// =========================================================

console.log(
  '✅ postRoutes.js loaded'
);

console.log(
  '✅ DELETE /:id route will be registered'
);

console.log(
  '✅ SHARE /:id/share route will be registered'
);


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
// FOLLOWING POSTS
// =========================================================

router.get(
  '/following',
  protect,
  getFollowingPosts
);


// =========================================================
// LIKE POST
// =========================================================

router.post(
  '/:id/like',
  protect,
  toggleLike
);


// =========================================================
// SAVE POST
// =========================================================

router.post(
  '/:id/save',
  protect,
  toggleSave
);


// =========================================================
// SHARE POST
// =========================================================

router.post(
  '/:id/share',
  protect,
  sharePost
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


console.log(
  '✅ DELETE /:id REGISTERED'
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


// =========================================================
// GET SINGLE POST
//
// IMPORTANT:
// Bu route eng oxirida turishi kerak,
// chunki '/:id' boshqa route'larni tutib qolmasligi kerak.
// =========================================================

router.get(
  '/:id',
  getPostById
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;