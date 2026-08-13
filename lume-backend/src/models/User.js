const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAdmin: { type: Boolean, default: false }, 
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  otp: { type: String },          // <--- НОВОЕ ПОЛЕ
  otpExpiry: { type: Date }       // <--- НОВОЕ ПОЛЕ
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', UserSchema);