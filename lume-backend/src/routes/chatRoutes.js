const express = require('express');
const router = express.Router();
const { 
  getConversations, 
  getMessages, 
  sendMessage, 
  updateMessage, // <--- Добавили импорт
  deleteMessage  // <--- Добавили импорт
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.post('/send', protect, upload.single('media'), sendMessage);

// ===== ДОБАВЛЕННЫЕ МАРШРУТЫ =====
router.put('/messages/:messageId', protect, updateMessage);
router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;