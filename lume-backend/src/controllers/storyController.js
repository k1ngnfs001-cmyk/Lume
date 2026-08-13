const Story = require('../models/Story');
const cloudinary = require('../config/cloudinary');

// Создать историю (с названием и медиа)
exports.createStory = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Необходимо указать название истории' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Необходимо загрузить фото или видео' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "lume_stories",
      resource_type: "auto"
    });

    const story = await Story.create({
      user: req.user._id,
      title: title.trim(),
      mediaUrl: result.secure_url,
      mediaType: result.resource_type === 'video' ? 'video' : 'image'
    });

    const populatedStory = await story.populate('user', 'username avatar');
    res.status(201).json(populatedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получить все активные истории (для ленты)
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    }).populate('user', 'username avatar').sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получить историю конкретного пользователя (для профиля)
exports.getUserStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      user: req.params.userId,
      expiresAt: { $gt: new Date() }
    }).populate('user', 'username avatar');
    res.json(story); // может быть null
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Удалить историю (свою)
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'История не найдена' });
    
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав на удаление этой истории' });
    }

    await story.deleteOne();
    res.json({ message: 'История удалена' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};