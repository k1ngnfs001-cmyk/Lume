const Post = require('../models/Post');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Медиа-файл не найден или не загружен.' });
    }

    let mediaUrl = '';
    let mediaType = 'none';

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "lume_posts",
      resource_type: "auto"
    });
    mediaUrl = result.secure_url;
    mediaType = result.resource_type === 'video' ? 'video' : 'image';

    const post = await Post.create({
      user: req.user._id,
      content,
      mediaUrl,
      mediaType
    });

    const populatedPost = await post.populate('user', 'username avatar');
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar isVerified')
      .populate('comments.replies.user', 'username avatar isVerified');
    
    // Явно помечаем, лайкнул ли этот пост текущий пользователь
    const processedPosts = posts.map(post => ({
      ...post.toObject(),
      isLikedByMe: post.likes.some(id => id.toString() === userId.toString()),
      isSavedByMe: post.savedBy.some(id => id.toString() === userId.toString())
    }));

    res.json(processedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId).populate('following');
    const followingIds = currentUser.following.map(u => u._id);
    
    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar isVerified')
      .populate('comments.replies.user', 'username avatar isVerified');

    // Явно помечаем, лайкнул ли этот пост текущий пользователь
    const processedPosts = posts.map(post => ({
      ...post.toObject(),
      isLikedByMe: post.likes.some(id => id.toString() === userId.toString()),
      isSavedByMe: post.savedBy.some(id => id.toString() === userId.toString())
    }));

    res.json(processedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== ЛАЙК ПОСТА (Атомарное обновление, без VersionError) =====
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const isLiked = post.likes.includes(userId);

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      isLiked 
        ? { $pull: { likes: userId } } 
        : { $addToSet: { likes: userId } },
      { new: true }
    );

    if (!isLiked && post.user.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'like',
        referenceId: post._id,
        text: `Понравился ваш пост`
      });
      const populatedNotif = await notification.populate('sender', 'username avatar');
      const io = req.app.get('io');
      io.to(post.user.toString()).emit('new_notification', populatedNotif);
    }

    res.json({ 
      likes: updatedPost.likes, 
      isLiked: !isLiked 
    });
  } catch (error) {
    console.error('Ошибка лайка:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== ЛАЙК КОММЕНТАРИЯ (Атомарно) =====
exports.toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Комментарий не найден' });

    const isLiked = comment.likes.includes(userId);

    await Post.updateOne(
      { _id: postId, 'comments._id': commentId },
      isLiked
        ? { $pull: { 'comments.$.likes': userId } }
        : { $addToSet: { 'comments.$.likes': userId } }
    );

    const updatedPost = await Post.findById(postId)
      .populate('comments.user comments.replies.user', 'username avatar isVerified');

    res.json({ success: true, comment: updatedPost.comments.id(commentId) });
  } catch (error) {
    console.error('Ошибка лайка комментария:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== ДОБАВЛЕНИЕ КОММЕНТАРИЯ (Атомарно) =====
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;

    const newComment = { user: req.user._id, text };

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: newComment } },
      { new: true }
    ).populate({
      path: 'comments.user',
      select: 'username avatar isVerified'
    });

    if (!updatedPost) return res.status(404).json({ message: 'Пост не найден' });

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    if (updatedPost.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: updatedPost.user,
        sender: req.user._id,
        type: 'comment',
        referenceId: updatedPost._id,
        text: `Комментарий: "${text.substring(0, 30)}..."`
      });
      const populatedNotif = await notification.populate('sender', 'username avatar');
      const io = req.app.get('io');
      io.to(updatedPost.user.toString()).emit('new_notification', populatedNotif);
    }

    res.status(201).json(addedComment);
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== ДОБАВЛЕНИЕ ОТВЕТА НА КОММЕНТАРИЙ (Атомарно) =====
exports.addCommentReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    const newReply = { user: req.user._id, text };

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, 'comments._id': commentId },
      { $push: { 'comments.$.replies': newReply } },
      { new: true }
    ).populate('comments.user comments.replies.user', 'username avatar isVerified');

    if (!updatedPost) return res.status(404).json({ message: 'Пост или комментарий не найден' });

    const parentComment = updatedPost.comments.id(commentId);
    const addedReply = parentComment.replies[parentComment.replies.length - 1];

    res.status(201).json({ success: true, reply: addedReply, commentId });
  } catch (error) {
    console.error('Ошибка добавления ответа:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== РЕДАКТИРОВАНИЕ КОММЕНТАРИЯ (Атомарно) =====
exports.editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text, isReply } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    let targetComment;
    if (isReply) {
      const parentComment = post.comments.find(c => c.replies.id(commentId));
      if (!parentComment) return res.status(404).json({ message: 'Ответ не найден' });
      targetComment = parentComment.replies.id(commentId);
    } else {
      targetComment = post.comments.id(commentId);
    }

    if (!targetComment) return res.status(404).json({ message: 'Комментарий не найден' });
    
    if (targetComment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Вы не можете редактировать чужой комментарий' });
    }

    await Post.updateOne(
      { _id: postId, 'comments._id': commentId },
      { $set: { 'comments.$.text': text } }
    );

    const updatedPost = await Post.findById(postId)
      .populate('comments.user comments.replies.user', 'username avatar isVerified');

    let updatedComment = isReply 
      ? updatedPost.comments.find(c => c.replies.id(commentId))?.replies.id(commentId)
      : updatedPost.comments.id(commentId);

    res.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error('Ошибка редактирования:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== УДАЛЕНИЕ КОММЕНТАРИЯ (Атомарно) =====
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { isReply } = req.body;

    if (isReply) {
      await Post.updateOne(
        { _id: postId, 'comments.replies._id': commentId },
        { $pull: { 'comments.$.replies': { _id: commentId } } }
      );
    } else {
      await Post.updateOne(
        { _id: postId },
        { $pull: { comments: { _id: commentId } } }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== СОХРАНЕНИЕ ПОСТА (Атомарно) =====
exports.toggleSave = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const isSaved = post.savedBy.includes(userId);
    
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      isSaved 
        ? { $pull: { savedBy: userId } } 
        : { $addToSet: { savedBy: userId } },
      { new: true }
    );

    res.json({ 
      isSaved: !isSaved, 
      savedBy: updatedPost.savedBy 
    });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Нет прав для редактирования' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "lume_posts",
        resource_type: "auto"
      });
      post.mediaUrl = result.secure_url;
      post.mediaType = result.resource_type === 'video' ? 'video' : 'image';
    }

    await post.save();
    const updatedPost = await post.populate('user', 'username avatar isVerified');
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};