const express =
  require('express');

const dotenv =
  require('dotenv');

const cors =
  require('cors');

const path =
  require('path');

const http =
  require('http');

const socketIO =
  require('socket.io');

const connectDB =
  require('./config/db');

const jwt =
  require('jsonwebtoken');

const Notification =
  require('./models/Notification');

const Message =
  require('./models/Message');


dotenv.config();

connectDB();


const app =
  express();


// =========================================================
// CORS
// =========================================================

app.use(
  cors({
    origin:
      '*',

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
// BODY
// =========================================================

app.use(
  express.json()
);


// =========================================================
// STATIC
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
  require(
    './routes/authRoutes'
  )
);


app.use(
  '/api/posts',
  require(
    './routes/postRoutes'
  )
);


app.use(
  '/api/users',
  require(
    './routes/userRoutes'
  )
);


app.use(
  '/api/chats',
  require(
    './routes/chatRoutes'
  )
);


app.use(
  '/api/stories',
  require(
    './routes/storyRoutes'
  )
);


app.use(
  '/api/notifications',
  require(
    './routes/notificationRoutes'
  )
);


app.use(
  '/api/admin',
  require(
    './routes/adminRoutes'
  )
);


app.use(
  '/api/search',
  require(
    './routes/searchRoutes'
  )
);


console.log(
  '✅ POST ROUTES LOADED'
);


// =========================================================
// TEST
// =========================================================

app.get(
  '/',
  (
    req,
    res
  ) => {

    res.json({
      message:
        'Lume API is running',

      status:
        'ok'
    });

  }
);


// =========================================================
// HTTP SERVER
// =========================================================

const server =
  http.createServer(
    app
  );


// =========================================================
// SOCKET.IO
// =========================================================

const io =
  socketIO(
    server,
    {
      cors: {
        origin:
          '*',

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
// SOCKET AUTH
// =========================================================

io.use(
  (
    socket,
    next
  ) => {

    const token =
      socket.handshake.auth?.token;


    if (!token) {

      console.log(
        '❌ Socket token отсутствует'
      );

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
        decoded.id.toString();


      next();

    } catch (error) {

      console.error(
        '❌ Socket auth error:',
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
  (
    socket
  ) => {

    const userId =
      socket.userId.toString();


    console.log(
      '🟢 SOCKET CONNECTED'
    );

    console.log(
      'USER ID:',
      userId
    );

    console.log(
      'SOCKET ID:',
      socket.id
    );


    // =======================================================
    // USER ROOM
    // =======================================================

    socket.join(
      userId
    );


    console.log(
      '🏠 JOINED ROOM:',
      userId
    );


    // =======================================================
    // PRIVATE MESSAGE
    // =======================================================

    socket.on(
      'private-message',
      async (
        data
      ) => {

        const {
          receiverId,
          content,
          mediaUrl,
          mediaType
        } = data;


        try {

          if (!receiverId) {
            return;
          }


          // ---------------------------------------------------
          // CREATE MESSAGE
          // ---------------------------------------------------

          const message =
            await Message.create({

              sender:
                userId,

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


          // ---------------------------------------------------
          // RECEIVER
          // ---------------------------------------------------

          io.to(
            receiverId.toString()
          ).emit(
            'private-message',
            populatedMsg
          );


          // ---------------------------------------------------
          // SENDER
          // ---------------------------------------------------

          socket.emit(
            'private-message',
            populatedMsg
          );


          // ---------------------------------------------------
          // NOTIFICATION
          // ---------------------------------------------------

          const notification =
            await Notification.create({

              recipient:
                receiverId,

              sender:
                userId,

              type:
                'message',

              referenceId:
                message._id,

              text:
                content?.trim()

                  ? `Новое сообщение: "${content.substring(
                      0,
                      40
                    )}${
                      content.length >
                      40
                        ? '...'
                        : ''
                    }"`

                  : mediaType ===
                    'video'

                    ? 'Отправил вам видео'

                    : mediaType ===
                      'image'

                      ? 'Отправил вам изображение'

                      : 'Отправил вам сообщение'

            });


          const populatedNotification =
            await notification.populate(
              'sender',
              'username avatar'
            );


          // ---------------------------------------------------
          // REAL TIME NOTIFICATION
          // ---------------------------------------------------

          io.to(
            receiverId.toString()
          ).emit(
            'new_notification',
            populatedNotification
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
      (
        reason
      ) => {

        console.log(
          '🔴 SOCKET DISCONNECTED'
        );

        console.log(
          'USER ID:',
          userId
        );

        console.log(
          'SOCKET ID:',
          socket.id
        );

        console.log(
          'REASON:',
          reason
        );

      }
    );

  }
);


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      'GLOBAL ERROR:',
      err
    );


    res.status(
      err.status ||
      500
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
      '======================================'
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      '🌐 Host: 0.0.0.0'
    );

    console.log(
      '======================================'
    );

  }
);


// =========================================================
// TIMEOUTS
// =========================================================

server.keepAliveTimeout =
  120000;

server.headersTimeout =
  120000;

server.requestTimeout =
  120000;