const express = require('express');
const router = express.Router();
const { search } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

// Маршрут для поиска (защищён авторизацией)
router.get('/', protect, search);

module.exports = router;