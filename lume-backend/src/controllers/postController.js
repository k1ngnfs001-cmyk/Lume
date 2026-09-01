// =========================================================
// SHARE POST
// =========================================================

exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const senderId = req.user._id;

    console.log('========== SHARE POST ==========');
    console.log('POST ID:', postId);
    console.log('SENDER:', senderId.toString());

    const post = await Post.findById(postId)
      .select('user')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден',
      });
    }

    const ownerId = post.user;

    console.log(
      'POST OWNER:',
      ownerId ? ownerId.toString() : null
    );

    // -----------------------------------------------------
    // НЕ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ САМОМУ СЕБЕ
    // -----------------------------------------------------

    if (!sameId(ownerId, senderId)) {
      const notification = await Notification.create({
        recipient: ownerId,
        sender: senderId,
        type: 'share',
        referenceId: post._id,
        text: 'Поделился вашим постом',
      });

      console.log(
        'NOTIFICATION CREATED:',
        notification._id.toString()
      );

      // ---------------------------------------------------
      // SOCKET.IO
      // ---------------------------------------------------

      const io = req.app.get('io');

      if (io) {
        const populatedNotification =
          await Notification.findById(
            notification._id
          ).populate(
            'sender',
            'username avatar isVerified'
          );

        io.to(ownerId.toString()).emit(
          'new_notification',
          populatedNotification
        );

        console.log(
          'SOCKET NOTIFICATION SENT TO:',
          ownerId.toString()
        );
      } else {
        console.warn(
          'Socket.io instance not found'
        );
      }
    }

    const shareUrl =
      `${req.protocol}://${req.get('host')}/post/${post._id}`;

    console.log(
      'SHARE URL:',
      shareUrl
    );

    console.log(
      '================================'
    );

    return res.json({
      success: true,
      shareUrl,
      postId: post._id,
    });

  } catch (error) {
    console.error(
      '❌ SHARE POST ERROR:',
      error
    );

    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Пост не найден',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};