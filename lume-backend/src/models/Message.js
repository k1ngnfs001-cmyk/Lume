const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);