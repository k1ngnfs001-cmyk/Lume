const User = require('../models/User');
const Post = require('../models/Post');

exports.search = async (req, res) => {
  try {
    const { q, type } = req.query;
    // Убираем пробелы с концов строки
    const cleanQuery = q ? q.trim() : '';
    
    if (!cleanQuery) {
      return res.json({ users: [], posts: [], reels: [] });
    }

    let users = [];
    let posts = [];
    let reels = [];

    // Создаем регулярное выражение для поиска (без учета регистра)
    const regex = new RegExp(cleanQuery, 'i');

    // 1. Поиск пользователей
    if (!type || type === 'users' || type === 'all') {
      users = await User.find({
        $or: [
          { username: regex },
          { email: regex }
        ]
      }).select('username avatar bio followers');
    }

    // 2. Поиск постов (текстовых или с картинками)
    if (!type || type === 'posts' || type === 'all') {
      posts = await Post.find({
        content: regex,
        $or: [{ mediaType: { $in: ['none', 'image'] } }] 
      })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    }

    // 3. Поиск Reels (видео постов)
    if (!type || type === 'reels' || type === 'all') {
      reels = await Post.find({
        mediaType: 'video',
        $or: [
          { content: regex },
          { 'user.username': regex } // Поиск по имени автора видео
        ]
      })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    }

    res.json({ users, posts, reels });
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({ message: error.message });
  }
};