const express = require('express');
const router = express.Router();
// ВАЖНО: Импортируем всё, что нужно, включая getFollowing
const { getUserProfile, updateProfile, toggleFollow, getFollowing } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile/:id', protect, getUserProfile);
router.put('/update', protect, upload.single('avatar'), updateProfile);
router.post('/follow/:id', protect, toggleFollow);
router.get('/following', protect, getFollowing);

module.exports = router;