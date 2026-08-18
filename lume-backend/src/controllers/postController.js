const Post = require('../models/Post');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    
    // ВАЖНО: Проверяем, есть ли файл в запросе
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
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar isVerified')
      .populate('comments.replies.user', 'username avatar isVerified');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= ИСПРАВЛЕННАЯ ФУНКЦИЯ (Без конфликтов версий) =============
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const isLiked = post.likes.includes(userId);

    // Атомарное обновление (без использования .save())
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      isLiked 
        ? { $pull: { likes: userId } }     // Убираем лайк
        : { $addToSet: { likes: userId } }, // Добавляем лайк
      { new: true }
    );

    // Отправляем уведомление только если лайк был поставлен (а не убран)
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
      isLiked: !isLiked // Отправляем новое состояние (true если поставили, false если убрали)
    });
  } catch (error) {
    console.error('Ошибка лайка:', error);
    res.status(500).json({ message: error.message });
  }
};
// ==========================================================================

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const newComment = { user: req.user._id, text };
    post.comments.push(newComment);
    await post.save();

    const populatedPost = await post.populate({
      path: 'comments.user',
      select: 'username avatar isVerified'
    });
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    if (post.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        referenceId: post._id,
        text: `Комментарий: "${text.substring(0, 30)}..."`
      });
      const populatedNotif = await notification.populate('sender', 'username avatar');
      const io = req.app.get('io');
      io.to(post.user.toString()).emit('new_notification', populatedNotif);
    }

    res.status(201).json(addedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSave = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Сначала просто проверим, сохранён ли уже пост
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    const isSaved = post.savedBy.includes(userId);
    
    // ===== ГЛАВНОЕ ИСПРАВЛЕНИЕ: Атомарное обновление, а не .save() =====
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      isSaved 
        ? { $pull: { savedBy: userId } }     // Убираем из сохранённых
        : { $addToSet: { savedBy: userId } }, // Добавляем в сохранённые
      { new: true } // Возвращаем обновлённый документ
    );
    // ====================================================================

    res.json({ 
      isSaved: !isSaved, 
      savedCount: updatedPost.savedBy.length 
    });

  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowingPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('following');
    const followingIds = currentUser.following.map(u => u._id);
    
    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar isVerified')
      .populate('comments.replies.user', 'username avatar isVerified');
      
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== ОБНОВЛЕНИЕ ПОСТА =====
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });
    // Проверка прав
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Нет прав для редактирования' });
    }

    const { content } = req.body;
    if (content !== undefined) {
      post.content = content;
    }

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

// ===== ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ =====
exports.toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Комментарий не найден' });

    const isLiked = comment.likes.includes(userId);
    if (isLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }
    await post.save();
    await post.populate('comments.user comments.replies.user', 'username avatar isVerified');
    res.json({ success: true, comment: post.comments.id(commentId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCommentReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Пост не найден' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Комментарий не найден' });

    const newReply = { user: req.user._id, text };
    comment.replies.push(newReply);
    await post.save();
    await post.populate('comments.user comments.replies.user', 'username avatar isVerified');
    const addedReply = comment.replies[comment.replies.length - 1];
    res.status(201).json({ success: true, reply: addedReply, commentId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    targetComment.text = text;
    await post.save();
    await post.populate('comments.user comments.replies.user', 'username avatar isVerified');
    res.json({ success: true, comment: targetComment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { isReply } = req.body;
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
      return res.status(403).json({ message: 'Вы не можете удалять чужой комментарий' });
    }

    if (isReply) {
      const parentComment = post.comments.find(c => c.replies.id(commentId));
      parentComment.replies.pull(commentId);
    } else {
      post.comments.pull(commentId);
    }
    
    await post.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};