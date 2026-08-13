const multer = require('multer');

// Храним файл в памяти (буфер), чтобы отправить в Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 МБ
});

module.exports = upload;