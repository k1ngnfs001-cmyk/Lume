const Notification = require('../models/Notification');

// =========================================================
// GET MY NOTIFICATIONS
// =========================================================

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error(
      'Ошибка загрузки уведомлений:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// =========================================================
// MARK ONE AS READ
// =========================================================

exports.markAsRead = async (req, res) => {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: req.user._id
        },
        {
          $set: {
            isRead: true
          }
        },
        {
          new: true
        }
      );

    if (!notification) {
      return res.status(404).json({
        message: 'Уведомление не найдено'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error(
      'Ошибка отметки уведомления:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// =========================================================
// MARK ALL AS READ
// =========================================================

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    res.json({
      success: true
    });
  } catch (error) {
    console.error(
      'Ошибка отметки всех уведомлений:',
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};