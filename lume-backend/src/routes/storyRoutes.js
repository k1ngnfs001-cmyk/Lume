const express = require('express');
const router = express.Router();
const { 
  createStory, 
  getStories, 
  deleteStory, 
  getUserStory // <--- добавили
} = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').post(protect, upload.single('media'), createStory).get(protect, getStories);
router.get('/user/:userId', protect, getUserStory); // <--- новый маршрут
router.route('/:id').delete(protect, deleteStory);

module.exports = router;