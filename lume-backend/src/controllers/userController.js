const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username displayName avatar')
      .populate('comments.user', 'username avatar');

    const isFollowing = user.followers.includes(req.user._id);
    res.json({ 
      user, 
      posts, 
      isFollowing: req.user._id.toString() !== req.params.id ? isFollowing : null 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const { displayName, username, bio } = req.body;
    
    // Если пытаемся сменить username, проверяем, не занят ли он
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Это имя пользователя уже занято!' });
      }
      user.username = username;
    }

    if (displayName !== undefined) user.displayName = displayName;
    user.bio = bio || user.bio;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "lume_avatars",
        resource_type: "image"
      });
      user.avatar = result.secure_url;
    }

    await user.save();
    res.json({ 
      _id: user._id, 
      username: user.username, 
      displayName: user.displayName,
      avatar: user.avatar, 
      bio: user.bio 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) return res.status(404).json({ message: 'Пользователь не найден' });
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Нельзя подписаться на себя' });
    }

    const isFollowing = targetUser.followers.includes(req.user._id);

    if (isFollowing) {
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user._id.toString());
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id.toString());
    } else {
      targetUser.followers.push(req.user._id);
      currentUser.following.push(req.params.id);

      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'follow',
        referenceId: currentUser._id,
        text: `${currentUser.displayName || currentUser.username} подписался на вас`
      });
      const populatedNotif = await notification.populate('sender', 'username avatar');
      const io = req.app.get('io');
      io.to(targetUser._id.toString()).emit('new_notification', populatedNotif);
    }

    await targetUser.save();
    await currentUser.save();

    res.json({ isFollowing: !isFollowing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('following', 'username avatar displayName');
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};