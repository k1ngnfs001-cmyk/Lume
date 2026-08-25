import {
  useNotifications
} from '../context/NotificationContext';

import {
  Link
} from 'react-router-dom';

import {
  motion
} from 'framer-motion';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';

      case 'save':
        return '🔖';

      case 'comment':
        return '💬';

      case 'comment_like':
        return '❤️';

      case 'reply':
        return '↩️';

      case 'message':
        return '💬';

      case 'follow':
        return '👤';

      case 'story':
        return '⭕';

      default:
        return '🔔';
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-dark
        flex
        flex-col
        items-center
        p-6
        pt-10
      "
    >
      <div
        className="
          w-full
          max-w-150
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          rounded-2xl
          p-6
        "
      >
        <div
          className="
            flex
            justify-between
            items-center
            mb-6
            border-b
            border-white/10
            pb-4
          "
        >
          <div>
            <h2
              className="
                text-white
                text-2xl
                font-bold
              "
            >
              Уведомления
            </h2>

            {unreadCount > 0 && (
              <p
                className="
                  text-accent
                  text-xs
                  mt-1
                "
              >
                Непрочитанных: {unreadCount}
              </p>
            )}
          </div>

          <button
            onClick={markAllAsRead}
            className="
              text-xs
              text-white/50
              hover:text-white
              transition
            "
          >
            Отметить все как прочитанные
          </button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p
              className="
                text-white/40
                text-center
                py-10
              "
            >
              У вас пока нет уведомлений.
            </p>
          ) : (
            notifications.map(
              (notification) => (
                <motion.div
                  key={notification._id}
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  onClick={() =>
                    markAsRead(
                      notification._id
                    )
                  }
                  className={`
                    flex
                    gap-4
                    p-4
                    rounded-xl
                    transition
                    cursor-pointer
                    ${
                      notification.isRead
                        ? 'opacity-60'
                        : 'bg-white/5 border border-white/10'
                    }
                  `}
                >
                  <Link
                    to={`/profile/${notification.sender?._id}`}
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                    className="shrink-0"
                  >
                    <div
                      className="
                        w-10
                        h-10
                        rounded-full
                        bg-gray-700
                        border
                        border-white/10
                        flex
                        items-center
                        justify-center
                        text-white
                        font-bold
                        overflow-hidden
                      "
                    >
                      {notification.sender?.avatar ? (
                        <img
                          src={
                            notification.sender.avatar
                          }
                          alt="Avatar"
                          className="
                            w-full
                            h-full
                            object-cover
                          "
                        />
                      ) : (
                        notification.sender?.username
                          ?.charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                  </Link>

                  <div
                    className="
                      flex-1
                      min-w-0
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <span>
                        {getIcon(
                          notification.type
                        )}
                      </span>

                      <Link
                        to={`/profile/${notification.sender?._id}`}
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                        className="
                          text-white
                          font-medium
                          hover:underline
                        "
                      >
                        @{notification.sender?.username}
                      </Link>
                    </div>

                    <span
                      className="
                        block
                        text-white/70
                        text-sm
                        mt-1
                      "
                    >
                      {notification.text}
                    </span>

                    <div
                      className="
                        text-white/30
                        text-xs
                        mt-1
                      "
                    >
                      {new Date(
                        notification.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;