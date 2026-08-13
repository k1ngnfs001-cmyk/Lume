const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).populate('sender receiver', 'username avatar').sort({ createdAt: -1 });

    const usersMap = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      if (!usersMap.has(otherUser._id.toString())) {
        usersMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg.content || 'Медиафайл',
          lastMessageTime: msg.createdAt
        });
      }
    });

    res.json(Array.from(usersMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    }).populate('sender receiver', 'username avatar').sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    let mediaUrl = '';
    let mediaType = 'none';

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      try {
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "lume_chats",
          resource_type: "auto"
        });
        mediaUrl = result.secure_url;
        mediaType = result.resource_type === 'video' ? 'video' : 'image';
      } catch (cloudError) {
        return res.status(500).json({ message: "Ошибка Cloudinary: " + cloudError.message });
      }
    }

    if (!receiver) {
      throw new Error("Не указан получатель сообщения (receiver)");
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      content: content || '',
      mediaUrl,
      mediaType
    });

    const populatedMsg = await message.populate('sender receiver', 'username avatar');
    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================================
//  ДОБАВЛЕННЫЕ ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ
// ==========================================================

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Сообщение не найдено' });

    // Проверяем, что это сообщение отправил текущий пользователь
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Вы можете редактировать только свои сообщения' });
    }

    message.content = text;
    await message.save();

    // ===== ВАЖНОЕ ИСПРАВЛЕНИЕ: Заполняем данные пользователя! =====
    const populatedMsg = await message.populate('sender receiver', 'username avatar');
    res.json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Сообщение не найдено' });

    // Проверяем, что это сообщение отправил текущий пользователь
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Вы можете удалять только свои сообщения' });
    }

    await message.deleteOne();
    res.json({ message: 'Сообщение удалено' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};