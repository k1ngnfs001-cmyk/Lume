const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 }, // <--- Добавлено: название истории
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);