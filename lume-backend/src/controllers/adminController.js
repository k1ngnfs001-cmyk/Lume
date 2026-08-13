const User = require('../models/User');
const Post = require('../models/Post');

// --- Существующие функции ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar isVerified')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });
    await post.deleteOne();
    res.json({ message: 'Пост удалён' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isAdmin) return res.status(400).json({ message: 'Нельзя удалить другого администратора!' });
    
    await Post.deleteMany({ user: user._id });
    await user.deleteOne();
    res.json({ message: 'Пользователь и его посты удалены' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleVerify = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isAdmin) return res.status(400).json({ message: 'Нельзя верифицировать администратора' });
    
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ 
      _id: user._id, 
      username: user.username, 
      isVerified: user.isVerified 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- НОВЫЕ ФУНКЦИИ ---
exports.updateUser = async (req, res) => {
  try {
    const { username, bio, avatar, role, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isAdmin && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нельзя редактировать другого администратора' });
    }
    
    user.username = username || user.username;
    user.bio = bio !== undefined ? bio : user.bio;
    user.avatar = avatar || user.avatar;
    if (role && !user.isAdmin) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });
    
    post.content = content || post.content;
    await post.save();
    const updatedPost = await post.populate('user', 'username avatar');
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Пост не найден' });
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findOne({ 'comments._id': req.params.id });
    if (!post) return res.status(404).json({ message: 'Комментарий не найден' });
    
    const comment = post.comments.id(req.params.id);
    comment.text = text || comment.text;
    await post.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findOne({ 'comments._id': req.params.id });
    if (!post) return res.status(404).json({ message: 'Комментарий не найден' });
    
    post.comments.id(req.params.id).deleteOne();
    await post.save();
    res.json({ message: 'Комментарий удалён' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (предыдущий код функций getAllUsers, updateUser и т.д.)

// ЗАБАНИТЬ / РАЗБАНИТЬ ПОЛЬЗОВАТЕЛЯ
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    // Нельзя забанить администратора!
    if (user.isAdmin) return res.status(400).json({ message: 'Нельзя забанить администратора' });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ 
      _id: user._id, 
      username: user.username, 
      isBanned: user.isBanned 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};