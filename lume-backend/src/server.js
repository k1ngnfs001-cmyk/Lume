const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');

dotenv.config();
connectDB();

const app = express();

// ===== ИСПРАВЛЕНИЕ: Разрешаем запросы с любых доменов (чтобы работало на Vercel) =====
app.use(cors());
// =============================================================================

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

const server = http.createServer(app);

// ===== ИСПРАВЛЕНИЕ: Разрешаем сокетам принимать запросы с любых доменов =====
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
// ============================================================================

app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`Пользователь ${socket.userId} подключился к сокету`);
  
  // Foydalanuvchini o'z ID si nomidagi xonaga kiritamiz
  socket.join(socket.userId);

  // Yangi xabar yuborish
  socket.on('private-message', async (data) => {
    const { receiverId, content, mediaUrl, mediaType } = data;
    const Message = require('./models/Message');
    try {
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
        mediaUrl,
        mediaType
      });
      const populatedMsg = await message.populate('sender receiver', 'username avatar');
      // Suhbatdoshga ham, o'ziga ham yuborish
      io.to(receiverId).emit('private-message', populatedMsg);
      socket.emit('private-message', populatedMsg);
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
    }
  });

  // ==========================================================
  //  YANGI QO'SHILGAN QISM: O'chirish va Tahrirlash signallari
  // ==========================================================
  
  // Xabar o'chirilganda suhbatdoshga xabar berish
  socket.on('deleteMessage', ({ messageId, receiverId }) => {
    io.to(receiverId).emit('messageDeleted', { messageId });
  });

  // Xabar tahrirlanganda suhbatdoshga xabar berish
  socket.on('editMessage', ({ updatedMessage, receiverId }) => {
    io.to(receiverId).emit('messageEdited', { updatedMessage });
  });
  
  // ==========================================================

  socket.on('disconnect', () => {
    console.log(`Пользователь ${socket.userId} отключился`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));