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
  deleteComment
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').post(protect, upload.single('media'), createPost).get(protect, getFeed);
router.get('/following', protect, getFollowingPosts);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.post('/:id/save', protect, toggleSave);
router.put('/:id', protect, upload.single('media'), updatePost);

// Маршруты для комментариев
router.post('/:postId/comments/:commentId/like', protect, toggleCommentLike);
router.post('/:postId/comments/:commentId/reply', protect, addCommentReply);
router.put('/:postId/comments/:commentId', protect, editComment);
router.delete('/:postId/comments/:commentId', protect, deleteComment);

module.exports = router;