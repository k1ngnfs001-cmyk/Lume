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
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // <--- РАСКОММЕНТИРОВАНО!
app.use('/api/search', require('./routes/searchRoutes'));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

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
  socket.join(socket.userId);

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
      io.to(receiverId).emit('private-message', populatedMsg);
      socket.emit('private-message', populatedMsg);
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Пользователь ${socket.userId} отключился`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));