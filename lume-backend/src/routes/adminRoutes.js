const express = require('express');
const router = express.Router();
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
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Включаем защиту isAdmin для всех маршрутов
router.get('/users', protect, isAdmin, getAllUsers);
router.get('/posts', protect, isAdmin, getAllPosts);
router.delete('/posts/:id', protect, isAdmin, deletePost);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.put('/verify/:id', protect, isAdmin, toggleVerify);
router.put('/users/:id', protect, isAdmin, updateUser);
router.put('/posts/:id', protect, isAdmin, updatePost);
router.get('/posts/:id/comments', protect, isAdmin, getPostComments);
router.put('/comments/:id', protect, isAdmin, updateComment);
router.delete('/comments/:id', protect, isAdmin, deleteComment);
router.put('/ban/:id', protect, isAdmin, toggleBan);

module.exports = router;