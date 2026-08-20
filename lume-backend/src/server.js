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


// =========================================================
// CORS
// =========================================================

app.use(
  cors({
    origin: '*',
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);


// =========================================================
// BODY PARSER
// =========================================================

app.use(
  express.json()
);


// =========================================================
// STATIC FILES
// =========================================================

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      '../uploads'
    )
  )
);


// =========================================================
// ROUTES
// =========================================================

app.use(
  '/api/auth',
  require('./routes/authRoutes')
);


const postRoutes =
  require('./routes/postRoutes');

app.use(
  '/api/posts',
  postRoutes
);

console.log(
  '✅ POST ROUTES LOADED'
);


app.use(
  '/api/users',
  require('./routes/userRoutes')
);

app.use(
  '/api/chats',
  require('./routes/chatRoutes')
);

app.use(
  '/api/stories',
  require('./routes/storyRoutes')
);

app.use(
  '/api/notifications',
  require('./routes/notificationRoutes')
);

app.use(
  '/api/admin',
  require('./routes/adminRoutes')
);

app.use(
  '/api/search',
  require('./routes/searchRoutes')
);


// =========================================================
// BASIC TEST ROUTE
// =========================================================

app.get(
  '/',
  (req, res) => {
    res.json({
      message: 'Lume API is running',
      status: 'ok'
    });
  }
);


// =========================================================
// HTTP SERVER
// =========================================================

const server =
  http.createServer(app);


// =========================================================
// SOCKET.IO
// =========================================================

const io =
  socketIO(
    server,
    {
      cors: {
        origin: '*',
        methods: [
          'GET',
          'POST'
        ]
      }
    }
  );

app.set(
  'io',
  io
);


// =========================================================
// SOCKET AUTHENTICATION
// =========================================================

io.use(
  (socket, next) => {

    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error(
          'Authentication error'
        )
      );
    }

    try {

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      socket.userId =
        decoded.id;

      next();

    } catch (error) {

      console.error(
        'Socket auth error:',
        error.message
      );

      next(
        new Error(
          'Authentication error'
        )
      );
    }
  }
);


// =========================================================
// SOCKET CONNECTION
// =========================================================

io.on(
  'connection',
  (socket) => {

    console.log(
      `Пользователь ${socket.userId} подключился к сокету`
    );


    // User room
    socket.join(
      socket.userId.toString()
    );


    // =======================================================
    // PRIVATE MESSAGE
    // =======================================================

    socket.on(
      'private-message',
      async (data) => {

        const {
          receiverId,
          content,
          mediaUrl,
          mediaType
        } = data;

        const Message =
          require('./models/Message');

        try {

          if (!receiverId) {
            return;
          }

          const message =
            await Message.create({
              sender:
                socket.userId,

              receiver:
                receiverId,

              content:
                content || '',

              mediaUrl:
                mediaUrl || '',

              mediaType:
                mediaType ||
                'none'
            });


          const populatedMsg =
            await message.populate(
              'sender receiver',
              'username avatar'
            );


          // Receiver
          io.to(
            receiverId.toString()
          ).emit(
            'private-message',
            populatedMsg
          );


          // Sender
          socket.emit(
            'private-message',
            populatedMsg
          );

        } catch (error) {

          console.error(
            'Ошибка сохранения сообщения:',
            error
          );

        }
      }
    );


    // =======================================================
    // DISCONNECT
    // =======================================================

    socket.on(
      'disconnect',
      () => {

        console.log(
          `Пользователь ${socket.userId} отключился`
        );

      }
    );

  }
);


// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'GLOBAL ERROR:',
      err
    );

    res.status(
      err.status || 500
    ).json({
      message:
        err.message ||
        'Server error'
    });
  }
);


// =========================================================
// SERVER START
// =========================================================

const PORT =
  process.env.PORT ||
  5000;


server.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      `🌐 Port: ${PORT}`
    );

  }
);


// =========================================================
// KEEP ALIVE / TIMEOUTS
// =========================================================

server.keepAliveTimeout =
  120000;

server.headersTimeout =
  120000;

server.requestTimeout =
  120000;