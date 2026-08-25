import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHeart,
  FaRegHeart,
  FaPlay,
  FaChevronUp,
  FaChevronDown,
  FaSearch,
  FaComment,
  FaBookmark,
  FaTrash,
  FaPencilAlt,
  FaReply
} from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';

const AdminPanel = ({ isSidebarOpen = true }) => {
  const { user: currentUser } = useAuth();
  const { showAlert, onConfirm } = useAlert();

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [viewerPost, setViewerPost] = useState(null);
  const [viewerPosts, setViewerPosts] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef(null);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);

  const editMediaInputRef = useRef(null);

  const [isUpdating, setIsUpdating] = useState(false);

  // =========================================================
  // HELPERS
  // =========================================================

  const getMediaUrl = (url) => {
    if (!url) return '';

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    if (url.startsWith('/uploads')) {
      return 'https://lume-5mof.onrender.com' + url;
    }

    return url;
  };

  const sameId = (a, b) =>
    a != null &&
    b != null &&
    String(a?._id || a) === String(b?._id || b);

  const isIdInArray = (arr, id) =>
    Array.isArray(arr) &&
    arr.some((item) => sameId(item, id));

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        usersRes,
        postsRes
      ] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/admin/posts')
      ]);

      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error(
        'Ошибка загрузки данных админа:',
        error
      );

      showAlert({
        title: 'Ошибка',
        message:
          error.response?.data?.message ||
          'Не удалось загрузить данные панели администратора'
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILTERS
  // =========================================================

  const filteredUsers = users.filter((user) =>
    user.username
      .toLowerCase()
      .includes(
        userSearchQuery.toLowerCase()
      ) ||
    (
      user.email &&
      user.email
        .toLowerCase()
        .includes(
          userSearchQuery.toLowerCase()
        )
    )
  );

  const filteredPosts = posts.filter((post) =>
    (
      post.content &&
      post.content
        .toLowerCase()
        .includes(
          postSearchQuery.toLowerCase()
        )
    ) ||
    (
      post.user?.username &&
      post.user.username
        .toLowerCase()
        .includes(
          postSearchQuery.toLowerCase()
        )
    )
  );

  // =========================================================
  // USER UPDATE
  // =========================================================

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const res = await axios.put(
        `/admin/users/${editingUser._id}`,
        editingUser
      );

      setUsers((prev) =>
        prev.map((user) =>
          user._id === editingUser._id
            ? res.data
            : user
        )
      );

      setEditingUser(null);

      showAlert({
        title: 'Успех',
        message: 'Пользователь обновлён!'
      });
    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка обновления: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDeleteUser = (id) => {
    onConfirm({
      title: 'Удаление пользователя',
      message:
        'Удалить пользователя и все его посты?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',

      onConfirm: async () => {
        try {
          await axios.delete(
            `/admin/users/${id}`
          );

          setUsers((prev) =>
            prev.filter(
              (user) => user._id !== id
            )
          );

          setPosts((prev) =>
            prev.filter(
              (post) =>
                post.user?._id !== id
            )
          );

          showAlert({
            title: 'Успех',
            message:
              'Пользователь и его посты удалены.'
          });
        } catch (error) {
          showAlert({
            title: 'Ошибка',
            message:
              'Ошибка удаления: ' +
              (
                error.response?.data?.message ||
                error.message
              )
          });
        }
      }
    });
  };

  // =========================================================
  // VERIFY
  // =========================================================

  const handleToggleVerify = async (id) => {
    try {
      const res = await axios.put(
        `/admin/verify/${id}`
      );

      const {
        isVerified
      } = res.data;

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? {
                ...user,
                isVerified
              }
            : user
        )
      );
    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // BAN / UNBAN
  // =========================================================

  const handleToggleBan = async (id) => {
    try {
      const res = await axios.put(
        `/admin/ban/${id}`
      );

      const {
        isBanned
      } = res.data;

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? {
                ...user,
                isBanned
              }
            : user
        )
      );

      console.log(
        isBanned
          ? '🚫 Пользователь заблокирован'
          : '✅ Пользователь разблокирован',
        res.data
      );

      showAlert({
        title: isBanned
          ? 'Пользователь заблокирован'
          : 'Пользователь разблокирован',

        message: isBanned
          ? 'Пользователь больше не может пользоваться аккаунтом.'
          : 'Пользователь снова может войти в аккаунт.'
      });

    } catch (error) {
      console.error(
        'Ошибка бана/разбана:',
        error
      );

      const message =
        error.response?.data?.message ||
        error.message ||
        'Неизвестная ошибка';

      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка бана/разбана: ' +
          message
      });
    }
  };

  // =========================================================
  // UPDATE POST
  // =========================================================

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const formData = new FormData();

      formData.append(
        'content',
        editingPost.content || ''
      );

      if (editMediaFile) {
        formData.append(
          'media',
          editMediaFile
        );
      }

      const res = await axios.put(
        `/admin/posts/${editingPost._id}`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data'
          }
        }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === editingPost._id
            ? res.data
            : post
        )
      );

      setEditingPost(null);
      setEditMediaFile(null);
      setEditMediaPreview(null);

      showAlert({
        title: 'Успех',
        message:
          'Пост и медиа обновлены!'
      });

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка обновления: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // DELETE POST
  // =========================================================

  const handleDeletePost = (id) => {
    onConfirm({
      title: 'Удаление поста',
      message:
        'Удалить этот пост?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',

      onConfirm: async () => {
        try {
          await axios.delete(
            `/admin/posts/${id}`
          );

          setPosts((prev) =>
            prev.filter(
              (post) => post._id !== id
            )
          );

          showAlert({
            title: 'Успех',
            message: 'Пост удалён.'
          });

        } catch (error) {
          showAlert({
            title: 'Ошибка',
            message:
              'Ошибка удаления: ' +
              (
                error.response?.data?.message ||
                error.message
              )
          });
        }
      }
    });
  };

  // =========================================================
  // COMMENTS
  // =========================================================

  const handleOpenComments = async (postId) => {
    setActiveCommentPostId(postId);

    try {
      const res = await axios.get(
        `/admin/posts/${postId}/comments`
      );

      setSelectedPostComments(
        res.data
      );

      setCommentsModalOpen(true);
    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка загрузки комментариев: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  const handleUpdateComment = async () => {
    if (
      !editingComment ||
      !editCommentText.trim()
    ) {
      return;
    }

    try {
      const response =
        await axios.put(
          `/admin/comments/${editingComment._id}`,
          {
            text: editCommentText
          }
        );

      setSelectedPostComments(
        (prev) =>
          prev.map((comment) =>
            comment._id ===
            editingComment._id
              ? response.data
              : comment
          )
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === activeCommentPostId
            ? {
                ...post,
                comments:
                  post.comments.map(
                    (comment) =>
                      comment._id ===
                      editingComment._id
                        ? response.data
                        : comment
                  )
              }
            : post
        )
      );

      setEditingComment(null);

      showAlert({
        title: 'Успех',
        message:
          'Комментарий обновлён.'
      });

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка обновления: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  const handleDeleteComment = (id) => {
    onConfirm({
      title: 'Удаление комментария',
      message:
        'Удалить этот комментарий?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',

      onConfirm: async () => {
        try {
          await axios.delete(
            `/admin/comments/${id}`
          );

          setSelectedPostComments(
            (prev) =>
              prev.filter(
                (comment) =>
                  comment._id !== id
              )
          );

          setPosts((prev) =>
            prev.map((post) =>
              post._id ===
              activeCommentPostId
                ? {
                    ...post,
                    comments:
                      post.comments.filter(
                        (comment) =>
                          comment._id !== id
                      )
                  }
                : post
            )
          );

          showAlert({
            title: 'Успех',
            message:
              'Комментарий удалён.'
          });

        } catch (error) {
          showAlert({
            title: 'Ошибка',
            message:
              'Ошибка удаления: ' +
              (
                error.response?.data?.message ||
                error.message
              )
          });
        }
      }
    });
  };

  // =========================================================
  // VIEWER
  // =========================================================

  const openViewer = (
    post,
    postsList
  ) => {
    const index =
      postsList.findIndex(
        (item) =>
          item._id === post._id
      );

    setViewerPosts(
      postsList
    );

    setViewerIndex(
      index
    );

    setViewerPost(
      post
    );

    setProgress(0);
    setIsMuted(true);
    setIsPlaying(true);
    setIsCommentsOpen(false);

    document.body.style.overflow =
      'hidden';
  };

  const closeViewer = () => {
    setViewerPost(null);
    setViewerPosts([]);
    setViewerIndex(0);
    setProgress(0);
    setIsMuted(true);
    setIsPlaying(true);
    setIsCommentsOpen(false);
    setIsUpdating(false);

    document.body.style.overflow =
      '';
  };

  const goNext = () => {
    if (
      viewerIndex <
      viewerPosts.length - 1
    ) {
      const nextIndex =
        viewerIndex + 1;

      setViewerIndex(
        nextIndex
      );

      setViewerPost(
        viewerPosts[nextIndex]
      );

      setProgress(0);
      setIsPlaying(true);
    }
  };

  const goPrev = () => {
    if (
      viewerIndex > 0
    ) {
      const prevIndex =
        viewerIndex - 1;

      setViewerIndex(
        prevIndex
      );

      setViewerPost(
        viewerPosts[prevIndex]
      );

      setProgress(0);
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();

    setIsMuted(
      (prev) => !prev
    );
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (
      videoRef.current.paused
    ) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const currentTime =
      videoRef.current.currentTime;

    const duration =
      videoRef.current.duration;

    if (
      duration &&
      duration > 0
    ) {
      setProgress(
        (currentTime /
          duration) *
        100
      );
    }
  };

  // =========================================================
  // UPDATE VIEWER POST EVERYWHERE
  // =========================================================

  const updateViewerPostEverywhere = (
    postId,
    updater
  ) => {
    setViewerPosts(
      (prev) =>
        prev.map((post) =>
          post._id === postId
            ? updater(post)
            : post
        )
    );

    setPosts(
      (prev) =>
        prev.map((post) =>
          post._id === postId
            ? updater(post)
            : post
        )
    );

    setViewerPost(
      (prev) =>
        prev &&
        prev._id === postId
          ? updater(prev)
          : prev
    );
  };

  // =========================================================
  // LIKE
  // =========================================================

  const handleLike = async (
    postId
  ) => {
    if (
      !postId ||
      isUpdating ||
      !currentUser?._id
    ) {
      return;
    }

    const targetPost =
      viewerPosts.find(
        (post) =>
          post._id === postId
      ) ||
      viewerPost;

    if (!targetPost) return;

    setIsUpdating(true);

    const wasLiked =
      targetPost.isLikedByMe ||
      isIdInArray(
        targetPost.likes,
        currentUser._id
      );

    const originalPost =
      targetPost;

    updateViewerPostEverywhere(
      postId,
      (post) => ({
        ...post,

        isLikedByMe:
          !wasLiked,

        likes: wasLiked
          ? (
              post.likes || []
            ).filter(
              (id) =>
                !sameId(
                  id,
                  currentUser._id
                )
            )
          : [
              ...(post.likes || []),
              currentUser._id
            ]
      })
    );

    try {
      const res =
        await axios.post(
          `/posts/${postId}/like`
        );

      updateViewerPostEverywhere(
        postId,
        (post) => ({
          ...post,

          isLikedByMe:
            Boolean(
              res.data.isLiked
            ),

          likes:
            Array.isArray(
              res.data.likes
            )
              ? res.data.likes
              : post.likes || []
        })
      );

    } catch (error) {
      updateViewerPostEverywhere(
        postId,
        () => originalPost
      );

      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка лайка: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });

    } finally {
      setIsUpdating(false);
    }
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async (
    postId
  ) => {
    if (
      !postId ||
      isUpdating ||
      !currentUser?._id
    ) {
      return;
    }

    const targetPost =
      viewerPosts.find(
        (post) =>
          post._id === postId
      ) ||
      viewerPost;

    if (!targetPost) return;

    setIsUpdating(true);

    const wasSaved =
      targetPost.isSavedByMe ||
      isIdInArray(
        targetPost.savedBy,
        currentUser._id
      );

    const originalPost =
      targetPost;

    updateViewerPostEverywhere(
      postId,
      (post) => ({
        ...post,

        isSavedByMe:
          !wasSaved,

        savedBy: wasSaved
          ? (
              post.savedBy || []
            ).filter(
              (id) =>
                !sameId(
                  id,
                  currentUser._id
                )
            )
          : [
              ...(post.savedBy || []),
              currentUser._id
            ]
      })
    );

    try {
      const res =
        await axios.post(
          `/posts/${postId}/save`
        );

      updateViewerPostEverywhere(
        postId,
        (post) => ({
          ...post,

          isSavedByMe:
            Boolean(
              res.data.isSaved
            ),

          savedBy:
            Array.isArray(
              res.data.savedBy
            )
              ? res.data.savedBy
              : post.savedBy || []
        })
      );

    } catch (error) {
      updateViewerPostEverywhere(
        postId,
        () => originalPost
      );

      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка сохранения: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });

    } finally {
      setIsUpdating(false);
    }
  };

  // =========================================================
  // ADD COMMENT
  // =========================================================

  const handleAddComment = async (
    postId
  ) => {
    if (
      !commentText.trim() ||
      !postId
    ) {
      return;
    }

    try {
      const response =
        await axios.post(
          `/posts/${postId}/comment`,
          {
            text: commentText
          }
        );

      const newComment =
        response.data;

      const updatePostComments =
        (post) =>
          post._id === postId
            ? {
                ...post,
                comments: [
                  ...(post.comments || []),
                  newComment
                ]
              }
            : post;

      setViewerPost(
        (prev) => ({
          ...prev,
          comments: [
            ...(prev?.comments || []),
            newComment
          ]
        })
      );

      setViewerPosts(
        (prev) =>
          prev.map(
            updatePostComments
          )
      );

      setPosts(
        (prev) =>
          prev.map(
            updatePostComments
          )
      );

      setCommentText('');

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка добавления комментария: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // COMMENT LIKE
  // =========================================================

  const handleCommentLike = async (
    postId,
    commentId
  ) => {
    try {
      const response =
        await axios.post(
          `/posts/${postId}/comments/${commentId}/like`
        );

      const updatedComment =
        response.data.comment;

      const updateComments =
        (comments) =>
          comments.map(
            (comment) =>
              comment._id === commentId
                ? updatedComment
                : comment
          );

      setViewerPost(
        (prev) => ({
          ...prev,
          comments:
            updateComments(
              prev?.comments || []
            )
        })
      );

      setViewerPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateComments(
                        post.comments || []
                      )
                  }
                : post
          )
      );

      setPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateComments(
                        post.comments || []
                      )
                  }
                : post
          )
      );

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка лайка комментария: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // REPLY
  // =========================================================

  const handleReply = async (
    postId,
    commentId
  ) => {
    const text =
      replyTexts[commentId];

    if (
      !text ||
      !text.trim()
    ) {
      return;
    }

    try {
      const response =
        await axios.post(
          `/posts/${postId}/comments/${commentId}/reply`,
          {
            text
          }
        );

      const {
        reply,
        commentId: parentId
      } = response.data;

      const updateReplies =
        (comments) =>
          comments.map(
            (comment) =>
              comment._id === parentId
                ? {
                    ...comment,
                    replies: [
                      ...(comment.replies || []),
                      reply
                    ]
                  }
                : comment
          );

      setViewerPost(
        (prev) => ({
          ...prev,
          comments:
            updateReplies(
              prev?.comments || []
            )
        })
      );

      setViewerPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateReplies(
                        post.comments || []
                      )
                  }
                : post
          )
      );

      setPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateReplies(
                        post.comments || []
                      )
                  }
                : post
          )
      );

      setReplyTexts(
        (prev) => ({
          ...prev,
          [commentId]: ''
        })
      );

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка добавления ответа: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // EDIT COMMENT
  // =========================================================

  const startEditComment = (
    commentId,
    currentText
  ) => {
    setEditingCommentId(
      commentId
    );

    setEditCommentText(
      currentText
    );
  };

  const saveEditComment = async (
    postId,
    commentId,
    isReply = false
  ) => {
    if (
      !editCommentText.trim()
    ) {
      return;
    }

    try {
      await axios.put(
        `/posts/${postId}/comments/${commentId}`,
        {
          text:
            editCommentText,
          isReply
        }
      );

      const updateComment =
        (comments) =>
          comments.map(
            (comment) => {
              if (
                !isReply &&
                comment._id ===
                  commentId
              ) {
                return {
                  ...comment,
                  text:
                    editCommentText
                };
              }

              if (isReply) {
                return {
                  ...comment,
                  replies:
                    (
                      comment.replies ||
                      []
                    ).map(
                      (reply) =>
                        reply._id ===
                        commentId
                          ? {
                              ...reply,
                              text:
                                editCommentText
                            }
                          : reply
                    )
                };
              }

              return comment;
            }
          );

      setViewerPost(
        (prev) => ({
          ...prev,
          comments:
            updateComment(
              prev?.comments || []
            )
        })
      );

      setViewerPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateComment(
                        post.comments || []
                      )
                  }
                : post
          )
      );

      setPosts(
        (prev) =>
          prev.map(
            (post) =>
              post._id === postId
                ? {
                    ...post,
                    comments:
                      updateComment(
                        post.comments || []
                      )
                  }
                : post
          )
      );

      setEditingCommentId(null);
      setEditCommentText('');

    } catch (error) {
      showAlert({
        title: 'Ошибка',
        message:
          'Ошибка редактирования: ' +
          (
            error.response?.data?.message ||
            error.message
          )
      });
    }
  };

  // =========================================================
  // DELETE COMMENT FROM POST VIEWER
  // =========================================================

  const deleteComment = (
    postId,
    commentId,
    isReply = false
  ) => {
    onConfirm({
      title: 'Удаление',
      message:
        'Вы уверены, что хотите удалить этот комментарий?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',

      onConfirm: async () => {
        try {
          await axios.delete(
            `/posts/${postId}/comments/${commentId}`,
            {
              data: {
                isReply
              }
            }
          );

          const filterComment =
            (comments) =>
              isReply
                ? comments.map(
                    (comment) => ({
                      ...comment,
                      replies:
                        (
                          comment.replies ||
                          []
                        ).filter(
                          (reply) =>
                            reply._id !==
                            commentId
                        )
                    })
                  )
                : comments.filter(
                    (comment) =>
                      comment._id !==
                      commentId
                  );

          setViewerPost(
            (prev) => ({
              ...prev,
              comments:
                filterComment(
                  prev?.comments || []
                )
            })
          );

          setViewerPosts(
            (prev) =>
              prev.map(
                (post) =>
                  post._id === postId
                    ? {
                        ...post,
                        comments:
                          filterComment(
                            post.comments || []
                          )
                      }
                    : post
              )
          );

          setPosts(
            (prev) =>
              prev.map(
                (post) =>
                  post._id === postId
                    ? {
                        ...post,
                        comments:
                          filterComment(
                            post.comments || []
                          )
                      }
                    : post
              )
          );

        } catch (error) {
          showAlert({
            title: 'Ошибка',
            message:
              'Ошибка удаления: ' +
              (
                error.response?.data?.message ||
                error.message
              )
          });
        }
      }
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="
        min-h-screen
        bg-dark
        flex
        items-center
        justify-center
        text-white/50
      ">
        Загрузка панели...
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="
      min-h-screen
      bg-dark
      p-8
      flex
      flex-col
      items-center
      text-white
      relative
    ">

      <div className="
        w-full
        max-w-6xl
        space-y-12
      ">

        <h1 className="
          text-4xl
          font-bold
        ">
          Панель администратора
        </h1>

        {/* =====================================================
            USERS
        ====================================================== */}

        <div>

          <div className="
            flex
            flex-col
            md:flex-row
            justify-between
            items-start
            md:items-center
            gap-4
            mb-4
          ">

            <h2 className="
              text-2xl
              font-bold
            ">
              Управление пользователями
            </h2>

            <div className="
              relative
              w-full
              md:w-64
            ">

              <FaSearch
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-white/40
                  text-sm
                "
              />

              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={userSearchQuery}
                onChange={(e) =>
                  setUserSearchQuery(
                    e.target.value
                  )
                }
                className="
                  w-full
                  bg-black/40
                  border
                  border-white/10
                  text-white
                  rounded-xl
                  pl-9
                  pr-4
                  py-2
                  outline-none
                  focus:ring-2
                  focus:ring-accent/50
                  placeholder:text-white/30
                "
              />

            </div>
          </div>

          <table className="
            w-full
            bg-white/5
            border
            border-white/10
            rounded-2xl
            overflow-hidden
          ">

            <thead className="
              bg-white/10
            ">
              <tr>
                <th className="p-4 text-left">
                  ID
                </th>

                <th className="p-4 text-left">
                  Имя
                </th>

                <th className="p-4 text-left">
                  Статус
                </th>

                <th className="p-4 text-right">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredUsers.length === 0 ? (

                <tr>
                  <td
                    colSpan="4"
                    className="
                      p-8
                      text-center
                      text-white/40
                    "
                  >
                    Пользователи не найдены
                  </td>
                </tr>

              ) : (

                filteredUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="
                      border-b
                      border-white/5
                      hover:bg-white/5
                    "
                  >

                    <td className="
                      p-4
                      font-mono
                      text-xs
                    ">
                      {user._id.slice(0, 8)}...
                    </td>

                    <td className="
                      p-4
                      flex
                      items-center
                      gap-2
                    ">
                      @{user.username}

                      {user.isVerified && (
                        <span className="text-blue-500">
                          ✓
                        </span>
                      )}

                      {user.isAdmin && (
                        <span className="
                          text-red-500
                          text-xs
                          ml-2
                          bg-red-500/20
                          px-2
                          py-0.5
                          rounded
                        ">
                          ADMIN
                        </span>
                      )}
                    </td>

                    <td className="p-4">

                      <button
                        onClick={() =>
                          handleToggleVerify(
                            user._id
                          )
                        }
                        disabled={
                          user.isAdmin
                        }
                        className={`
                          px-3
                          py-1
                          rounded-full
                          text-xs
                          ${
                            user.isAdmin
                              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                              : user.isVerified
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }
                        `}
                      >
                        {user.isAdmin
                          ? 'Недоступно'
                          : user.isVerified
                            ? 'Верифицирован'
                            : 'Не верифицирован'}
                      </button>

                    </td>

                    <td className="
                      p-4
                      text-right
                      space-x-2
                    ">

                      <button
                        onClick={() =>
                          setEditingUser(
                            user
                          )
                        }
                        className="
                          px-4
                          py-1
                          bg-blue-500/10
                          text-blue-400
                          rounded-lg
                          hover:bg-blue-500/20
                          transition
                        "
                      >
                        ✎
                      </button>

                      <button
                        onClick={() =>
                          handleToggleBan(
                            user._id
                          )
                        }
                        disabled={
                          user.isAdmin
                        }
                        className={`
                          px-3
                          py-1
                          rounded-lg
                          text-xs
                          transition
                          ${
                            user.isAdmin
                              ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                              : user.isBanned
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }
                        `}
                      >
                        {user.isAdmin
                          ? '-'
                          : user.isBanned
                            ? 'Разбанить'
                            : 'Забанить'}
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteUser(
                            user._id
                          )
                        }
                        disabled={
                          user.isAdmin
                        }
                        className={`
                          px-4
                          py-1
                          rounded-lg
                          ${
                            user.isAdmin
                              ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }
                        `}
                      >
                        {user.isAdmin
                          ? '-'
                          : 'Удалить'}
                      </button>

                    </td>

                  </tr>

                ))
              )}

            </tbody>
          </table>
        </div>

        {/* =====================================================
            POSTS
        ====================================================== */}

        <div>

          <div className="
            flex
            flex-col
            md:flex-row
            justify-between
            items-start
            md:items-center
            gap-4
            mb-4
          ">

            <h2 className="
              text-2xl
              font-bold
            ">
              Управление постами
            </h2>

            <div className="
              relative
              w-full
              md:w-64
            ">

              <FaSearch
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-white/40
                  text-sm
                "
              />

              <input
                type="text"
                placeholder="Поиск по описанию или автору..."
                value={postSearchQuery}
                onChange={(e) =>
                  setPostSearchQuery(
                    e.target.value
                  )
                }
                className="
                  w-full
                  bg-black/40
                  border
                  border-white/10
                  text-white
                  rounded-xl
                  pl-9
                  pr-4
                  py-2
                  outline-none
                  focus:ring-2
                  focus:ring-accent/50
                  placeholder:text-white/30
                "
              />

            </div>
          </div>

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-6
          ">

            {filteredPosts.length === 0 ? (

              <div className="
                col-span-3
                py-10
                text-center
                text-white/40
              ">
                Посты не найдены
              </div>

            ) : (

              filteredPosts.map((post) => (

                <div
                  key={post._id}
                  onClick={() =>
                    openViewer(
                      post,
                      posts
                    )
                  }
                  className="
                    bg-white/5
                    border
                    border-white/10
                    rounded-2xl
                    p-4
                    relative
                    cursor-pointer
                    hover:bg-white/10
                    transition
                  "
                >

                  <div className="
                    mb-2
                    pointer-events-none
                  ">

                    <p className="
                      text-white/80
                      text-sm
                    ">
                      @{post.user?.username}
                    </p>

                    <p className="
                      text-white
                      line-clamp-3
                      mt-1
                    ">
                      {post.content ||
                        'Без текста'}
                    </p>

                    {post.mediaUrl && (

                      <div className="
                        mt-2
                        w-full
                        aspect-[1/1]
                        bg-black/40
                        rounded-lg
                        overflow-hidden
                        border
                        border-white/5
                      ">

                        {post.mediaType ===
                        'video' ? (

                          <video
                            src={getMediaUrl(
                              post.mediaUrl
                            )}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                            muted
                            preload="metadata"
                            playsInline
                          />

                        ) : (

                          <img
                            src={getMediaUrl(
                              post.mediaUrl
                            )}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                            alt="Media"
                          />

                        )}

                      </div>
                    )}

                  </div>

                  <div className="
                    flex
                    justify-between
                    items-center
                    mt-3
                    pt-3
                    border-t
                    border-white/5
                  ">

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenComments(
                          post._id
                        );
                      }}
                      className="
                        text-xs
                        text-white/50
                        flex
                        items-center
                        gap-1
                        hover:text-white
                        transition
                      "
                    >
                      💬 {
                        post.comments?.length ||
                        0
                      } комментов
                    </button>

                    <div className="
                      space-x-2
                    ">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          setEditingPost(
                            post
                          );

                          setEditMediaFile(
                            null
                          );

                          setEditMediaPreview(
                            null
                          );
                        }}
                        className="
                          px-3
                          py-1
                          bg-blue-500/10
                          text-blue-400
                          rounded-lg
                          text-xs
                          hover:bg-blue-500/20
                        "
                      >
                        ✎
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          handleDeletePost(
                            post._id
                          );
                        }}
                        className="
                          px-3
                          py-1
                          bg-red-500/10
                          text-red-400
                          rounded-lg
                          text-xs
                          hover:bg-red-500/20
                        "
                      >
                        Удалить
                      </button>

                    </div>
                  </div>
                </div>

              ))
            )}

          </div>
        </div>
      </div>

      {/* =====================================================
          POST VIEWER
      ====================================================== */}

      <AnimatePresence>

        {viewerPost && (

          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className={`
              fixed
              top-0
              right-0
              bottom-0
              z-[9999]
              bg-[#0a0a0a]
              flex
              items-center
              justify-center
              overflow-hidden
              transition-all
              duration-300
              ease-in-out
              ${
                isSidebarOpen
                  ? 'left-[260px]'
                  : 'left-0'
              }
            `}
          >

            <div className="
              flex
              flex-row
              items-center
              justify-center
              gap-4
              md:gap-8
              w-full
              max-w-[1000px]
              mx-auto
              px-4
              h-full
            ">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeViewer();
                }}
                className="
                  absolute
                  top-4
                  right-4
                  z-20
                  text-white/80
                  hover:text-white
                  p-2
                  bg-black/60
                  rounded-full
                  backdrop-blur-sm
                  transition
                "
              >
                ✕
              </button>

              <div className={`
                flex
                flex-row
                items-center
                justify-center
                gap-4
                md:gap-8
                transition-all
                duration-300
                ease-in-out
                w-full
                ${
                  isCommentsOpen
                    ? 'translate-x-[-180px]'
                    : 'translate-x-0'
                }
              `}>

                {/* MEDIA */}

                <div className="
                  flex-1
                  flex
                  items-center
                  justify-center
                  min-w-0
                  h-full
                ">

                  <div className="
                    relative
                    w-full
                    max-w-[450px]
                    lg:max-w-[650px]
                    aspect-[1/1]
                    max-h-[85vh]
                    rounded-[24px]
                    overflow-hidden
                    bg-black
                    shadow-2xl
                    cursor-pointer
                  ">

                    <button
                      onClick={toggleMute}
                      className="
                        absolute
                        top-4
                        left-4
                        z-30
                        bg-black/60
                        backdrop-blur-sm
                        hover:bg-black/80
                        p-2
                        rounded-full
                        text-white
                        transition
                      "
                    >
                      {isMuted
                        ? '🔇'
                        : '🔊'}
                    </button>

                    <div
                      onClick={
                        handleVideoClick
                      }
                      className="
                        w-full
                        h-full
                        relative
                      "
                    >

                      <AnimatePresence
                        mode="wait"
                      >

                        <motion.div
                          key={
                            viewerPost._id
                          }
                          initial={{
                            opacity: 0
                          }}
                          animate={{
                            opacity: 1
                          }}
                          exit={{
                            opacity: 0
                          }}
                          transition={{
                            duration: 0.3
                          }}
                          className="
                            w-full
                            h-full
                            relative
                          "
                        >

                          {viewerPost.mediaUrl ? (

                            viewerPost.mediaType ===
                            'video' ? (

                              <video
                                ref={videoRef}
                                src={getMediaUrl(
                                  viewerPost.mediaUrl
                                )}
                                className="
                                  w-full
                                  h-full
                                  object-cover
                                "
                                autoPlay
                                loop
                                playsInline
                                muted={
                                  isMuted
                                }
                                onTimeUpdate={
                                  handleTimeUpdate
                                }
                                onPlay={() =>
                                  setIsPlaying(
                                    true
                                  )
                                }
                                onPause={() =>
                                  setIsPlaying(
                                    false
                                  )
                                }
                              />

                            ) : (

                              <img
                                src={getMediaUrl(
                                  viewerPost.mediaUrl
                                )}
                                className="
                                  w-full
                                  h-full
                                  object-cover
                                "
                                alt="Reel"
                                crossOrigin="anonymous"
                              />

                            )

                          ) : (

                            <div className="
                              w-full
                              h-full
                              bg-gray-800
                              flex
                              items-center
                              justify-center
                              text-white/30
                              text-4xl
                              font-bold
                              text-center
                              p-4
                            ">
                              {viewerPost.content}
                            </div>

                          )}

                          <div className="
                            absolute
                            bottom-0
                            left-0
                            right-0
                            h-[40%]
                            bg-gradient-to-t
                            from-black/90
                            via-black/40
                            to-transparent
                            pointer-events-none
                            rounded-b-[24px]
                          " />

                          <div className="
                            absolute
                            bottom-6
                            left-4
                            z-10
                            text-left
                          ">

                            <Link
                              to={`/profile/${viewerPost.user?._id}`}
                              className="
                                inline-flex
                                items-center
                                gap-3
                                mb-2
                                hover:opacity-80
                                transition
                              "
                            >

                              <div className="
                                w-8
                                h-8
                                rounded-full
                                bg-accent
                                flex
                                items-center
                                justify-center
                                text-white
                                font-bold
                                text-xs
                                overflow-hidden
                                shrink-0
                              ">

                                {viewerPost.user?.avatar &&
                                viewerPost.user.avatar !== '' ? (

                                  <img
                                    src={
                                      viewerPost.user.avatar
                                    }
                                    alt="Avatar"
                                    className="
                                      w-full
                                      h-full
                                      object-cover
                                    "
                                    crossOrigin="anonymous"
                                  />

                                ) : (

                                  viewerPost.user?.username
                                    ?.charAt(0)
                                    .toUpperCase()

                                )}

                              </div>

                              <div className="
                                flex
                                flex-row
                                items-center
                                gap-1.5
                              ">

                                <span className="
                                  text-white
                                  font-bold
                                  text-base
                                  drop-shadow-lg
                                  flex
                                  items-center
                                  gap-1
                                ">
                                  @{viewerPost.user?.username}

                                  {viewerPost.user?.isVerified && (
                                    <span className="
                                      text-blue-500
                                      text-lg
                                      ml-1
                                    ">
                                      ✓
                                    </span>
                                  )}
                                </span>

                                <span className="
                                  text-white/50
                                  text-xs
                                  font-medium
                                  drop-shadow-md
                                  mt-0.5
                                ">
                                  ·{' '}
                                  {viewerPost.createdAt
                                    ? new Date(
                                        viewerPost.createdAt
                                      ).toLocaleDateString(
                                        'ru-RU',
                                        {
                                          day:
                                            '2-digit',
                                          month:
                                            '2-digit',
                                          year:
                                            '2-digit'
                                        }
                                      ).replace(
                                        /\./g,
                                        '-'
                                      )
                                    : ''}
                                </span>

                              </div>

                            </Link>

                            <p className="
                              text-white/90
                              text-sm
                              drop-shadow-md
                              leading-relaxed
                              max-w-[80%]
                            ">
                              {viewerPost.content}
                            </p>

                          </div>

                          <AnimatePresence>

                            {!isPlaying && (

                              <motion.div
                                initial={{
                                  opacity: 0,
                                  scale: 0.5
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.5
                                }}
                                transition={{
                                  duration: 0.2
                                }}
                                className="
                                  absolute
                                  inset-0
                                  flex
                                  items-center
                                  justify-center
                                  z-20
                                  pointer-events-none
                                "
                              >

                                <div className="
                                  w-16
                                  h-16
                                  bg-black/60
                                  backdrop-blur-md
                                  rounded-full
                                  flex
                                  items-center
                                  justify-center
                                  text-white
                                  shadow-lg
                                ">
                                  <FaPlay
                                    className="ml-1"
                                    size={24}
                                  />
                                </div>

                              </motion.div>

                            )}

                          </AnimatePresence>

                        </motion.div>

                      </AnimatePresence>

                    </div>
                  </div>
                </div>

                {/* =================================================
                    RIGHT BUTTONS
                ================================================== */}

                <div className="
                  flex
                  flex-col
                  items-center
                  gap-4
                  py-4
                  shrink-0
                  min-w-[60px]
                  md:min-w-[80px]
                ">

                  <div className="relative">

                    <Link
                      to={`/profile/${viewerPost.user?._id}`}
                    >
                      <div className="
                        w-12
                        h-12
                        rounded-full
                        border-[2px]
                        border-white/30
                        bg-gray-800
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                        cursor-pointer
                        hover:border-accent
                        transition
                      ">

                        {viewerPost.user?.avatar &&
                        viewerPost.user.avatar !== '' ? (

                          <img
                            src={
                              viewerPost.user.avatar
                            }
                            alt="Avatar"
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                            crossOrigin="anonymous"
                          />

                        ) : (

                          <span className="
                            text-white
                            font-bold
                            text-lg
                          ">
                            {viewerPost.user?.username
                              ?.charAt(0)
                              .toUpperCase()}
                          </span>

                        )}

                      </div>
                    </Link>

                  </div>

                  {/* LIKE */}

                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      gap-1
                      cursor-pointer
                    "
                    onClick={() =>
                      handleLike(
                        viewerPost._id
                      )
                    }
                  >

                    <div className="
                      w-12
                      h-12
                      rounded-full
                      bg-black/60
                      backdrop-blur-md
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      hover:bg-black/80
                      transition
                    ">

                      {viewerPost.isLikedByMe ||
                      isIdInArray(
                        viewerPost.likes,
                        currentUser?._id
                      ) ? (

                        <FaHeart className="
                          text-red-500
                          text-xl
                        " />

                      ) : (

                        <FaRegHeart className="
                          text-white/80
                          text-xl
                        " />

                      )}

                    </div>

                    <span className="
                      text-white/80
                      text-[11px]
                      font-bold
                      tracking-wide
                    ">
                      {viewerPost.likes?.length || 0}
                    </span>

                  </div>

                  {/* COMMENTS */}

                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      gap-1
                      cursor-pointer
                    "
                    onClick={(e) => {
                      e.stopPropagation();

                      setIsCommentsOpen(
                        (prev) => !prev
                      );
                    }}
                  >

                    <div className="
                      w-12
                      h-12
                      rounded-full
                      bg-black/60
                      backdrop-blur-md
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      hover:bg-black/80
                      transition
                    ">
                      <FaComment className="
                        text-white/80
                        text-xl
                      " />
                    </div>

                    <span className="
                      text-white/80
                      text-[11px]
                      font-bold
                      tracking-wide
                    ">
                      {viewerPost.comments?.length || 0}
                    </span>

                  </div>

                  {/* SAVE */}

                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      gap-1
                      cursor-pointer
                    "
                    onClick={() =>
                      handleSave(
                        viewerPost._id
                      )
                    }
                  >

                    <div className="
                      w-12
                      h-12
                      rounded-full
                      bg-black/60
                      backdrop-blur-md
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      hover:bg-black/80
                      transition
                    ">

                      {viewerPost.isSavedByMe ||
                      isIdInArray(
                        viewerPost.savedBy,
                        currentUser?._id
                      ) ? (

                        <FaBookmark className="
                          text-yellow-400
                          text-xl
                        " />

                      ) : (

                        <FiBookmark className="
                          text-white/80
                          text-xl
                        " />

                      )}

                    </div>

                    <span className="
                      text-white/80
                      text-[11px]
                      font-bold
                      tracking-wide
                    ">
                      {viewerPost.savedBy?.length || 0}
                    </span>

                  </div>

                  {/* NAVIGATION */}

                  <div className="
                    border-t
                    border-white/10
                    pt-4
                    mt-4
                    flex
                    flex-col
                    gap-3
                    w-full
                    items-center
                  ">

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      disabled={
                        viewerIndex === 0
                      }
                      className="
                        w-10
                        h-10
                        bg-black/60
                        backdrop-blur-md
                        rounded-full
                        border
                        border-white/10
                        text-white
                        hover:bg-black/80
                        transition
                        disabled:opacity-30
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FaChevronUp
                        size={16}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      disabled={
                        viewerIndex ===
                        viewerPosts.length - 1
                      }
                      className="
                        w-10
                        h-10
                        bg-black/60
                        backdrop-blur-md
                        rounded-full
                        border
                        border-white/10
                        text-white
                        hover:bg-black/80
                        transition
                        disabled:opacity-30
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FaChevronDown
                        size={16}
                      />
                    </button>

                  </div>

                </div>

              </div>

              {/* =================================================
                  COMMENTS PANEL
              ================================================== */}

              <AnimatePresence>

                {isCommentsOpen && (

                  <motion.div
                    initial={{
                      x: '100%'
                    }}
                    animate={{
                      x: 0
                    }}
                    exit={{
                      x: '100%'
                    }}
                    transition={{
                      duration: 0.3
                    }}
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                    className="
                      absolute
                      right-0
                      top-0
                      bottom-0
                      w-[420px]
                      bg-[#0a0a0a]/95
                      backdrop-blur-xl
                      border-l
                      border-white/10
                      z-40
                      p-6
                      flex
                      flex-col
                      shadow-2xl
                    "
                  >

                    <div className="
                      flex
                      justify-between
                      items-center
                      mb-6
                      border-b
                      border-white/10
                      pb-4
                    ">

                      <span className="
                        text-white
                        font-bold
                        text-lg
                      ">
                        Комментарии
                      </span>

                      <button
                        onClick={() =>
                          setIsCommentsOpen(false)
                        }
                        className="
                          text-white/50
                          hover:text-white
                          transition
                          text-xl
                        "
                      >
                        ✕
                      </button>

                    </div>

                    <div className="
                      flex-1
                      overflow-y-auto
                      space-y-6
                      pr-2
                      pb-20
                      custom-scrollbar
                    ">

                      {viewerPost.comments?.length === 0 && (
                        <p className="
                          text-white/40
                          text-center
                          mt-10
                        ">
                          Нет комментариев
                        </p>
                      )}

                      {viewerPost.comments?.map(
                        (comment) => {

                          const isCommentAuthor =
                            currentUser?._id ===
                            comment.user?._id;

                          const isPostAuthor =
                            currentUser?._id ===
                            viewerPost.user?._id;

                          const isLikedByMe =
                            isIdInArray(
                              comment.likes,
                              currentUser?._id
                            );

                          return (
                            <div
                              key={
                                comment._id
                              }
                              className="
                                border-b
                                border-white/5
                                pb-4
                              "
                            >

                              <div className="
                                flex
                                gap-3
                                mb-2
                              ">

                                <Link
                                  to={`/profile/${comment.user?._id}`}
                                  className="
                                    shrink-0
                                    hover:opacity-80
                                    transition
                                  "
                                >
                                  <div className="
                                    w-8
                                    h-8
                                    rounded-full
                                    bg-gray-700
                                    flex
                                    items-center
                                    justify-center
                                    text-xs
                                    text-white
                                    overflow-hidden
                                  ">

                                    {comment.user?.avatar ? (

                                      <img
                                        src={
                                          comment.user.avatar
                                        }
                                        alt="Avatar"
                                        className="
                                          w-full
                                          h-full
                                          object-cover
                                        "
                                        crossOrigin="anonymous"
                                      />

                                    ) : (

                                      comment.user?.username
                                        ?.charAt(0)
                                        .toUpperCase()

                                    )}

                                  </div>
                                </Link>

                                <div className="flex-1">

                                  <div className="
                                    flex
                                    items-center
                                    gap-2
                                    flex-wrap
                                  ">

                                    <Link
                                      to={`/profile/${comment.user?._id}`}
                                      className="
                                        text-white/60
                                        text-xs
                                        font-medium
                                        hover:text-white
                                        transition
                                        inline-block
                                      "
                                    >
                                      @{comment.user?.username}
                                    </Link>

                                    {isPostAuthor && (
                                      <span className="
                                        text-[10px]
                                        text-red-400
                                        bg-red-500/10
                                        px-1.5
                                        py-0.5
                                        rounded
                                        border
                                        border-red-500/20
                                      ">
                                        Автор
                                      </span>
                                    )}

                                    {comment.user?.isVerified && (
                                      <span className="
                                        text-blue-500
                                        text-xs
                                      ">
                                        ✓
                                      </span>
                                    )}

                                  </div>

                                  {editingCommentId ===
                                  comment._id ? (

                                    <div className="
                                      mt-1
                                      flex
                                      flex-col
                                      gap-2
                                    ">

                                      <textarea
                                        value={
                                          editCommentText
                                        }
                                        onChange={(e) =>
                                          setEditCommentText(
                                            e.target.value
                                          )
                                        }
                                        className="
                                          w-full
                                          bg-black/40
                                          border
                                          border-white/10
                                          text-white
                                          rounded-lg
                                          px-3
                                          py-2
                                          text-sm
                                          outline-none
                                          focus:ring-1
                                          focus:ring-accent/50
                                          resize-none
                                        "
                                        rows="2"
                                      />

                                      <div className="
                                        flex
                                        gap-2
                                      ">

                                        <button
                                          onClick={() => {
                                            setEditingCommentId(
                                              null
                                            );
                                            setEditCommentText(
                                              ''
                                            );
                                          }}
                                          className="
                                            text-xs
                                            text-white/50
                                            hover:text-white
                                          "
                                        >
                                          Отмена
                                        </button>

                                        <button
                                          onClick={() =>
                                            saveEditComment(
                                              viewerPost._id,
                                              comment._id,
                                              false
                                            )
                                          }
                                          className="
                                            text-xs
                                            text-accent
                                            hover:opacity-80
                                          "
                                        >
                                          Сохранить
                                        </button>

                                      </div>
                                    </div>

                                  ) : (

                                    <p className="
                                      text-white/80
                                      text-sm
                                      mt-1
                                    ">
                                      {comment.text}
                                    </p>

                                  )}

                                </div>
                              </div>

                              <div className="
                                flex
                                items-center
                                gap-4
                                ml-11
                                mt-1
                              ">

                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1
                                    cursor-pointer
                                  "
                                  onClick={() =>
                                    handleCommentLike(
                                      viewerPost._id,
                                      comment._id
                                    )
                                  }
                                >

                                  <span
                                    className={`
                                      text-sm
                                      transition-colors
                                      ${
                                        isLikedByMe
                                          ? 'text-red-500'
                                          : 'text-white/40 hover:text-white'
                                      }
                                    `}
                                  >
                                    {isLikedByMe ? (
                                      <FaHeart />
                                    ) : (
                                      <FaRegHeart />
                                    )}
                                  </span>

                                  <span className="
                                    text-xs
                                    text-white/40
                                  ">
                                    {comment.likes?.length > 0
                                      ? comment.likes.length
                                      : ''}
                                  </span>

                                </div>

                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1
                                    cursor-pointer
                                    text-white/40
                                    hover:text-white
                                    transition
                                    text-xs
                                  "
                                  onClick={() => {
                                    const input =
                                      document.getElementById(
                                        `reply-input-${comment._id}`
                                      );

                                    if (input) {
                                      input.focus();
                                    }
                                  }}
                                >
                                  <FaReply
                                    size={12}
                                  />

                                  <span>
                                    Ответить
                                  </span>
                                </div>

                                {isCommentAuthor &&
                                  !editingCommentId && (

                                    <div className="
                                      flex
                                      items-center
                                      gap-2
                                      text-white/30
                                      ml-auto
                                    ">

                                      <button
                                        onClick={() =>
                                          startEditComment(
                                            comment._id,
                                            comment.text
                                          )
                                        }
                                        className="
                                          hover:text-white
                                          transition
                                        "
                                      >
                                        <FaPencilAlt
                                          size={12}
                                        />
                                      </button>

                                      <button
                                        onClick={() =>
                                          deleteComment(
                                            viewerPost._id,
                                            comment._id,
                                            false
                                          )
                                        }
                                        className="
                                          hover:text-red-400
                                          transition
                                        "
                                      >
                                        <FaTrash
                                          size={12}
                                        />
                                      </button>

                                    </div>

                                  )}

                              </div>

                              <div className="
                                ml-11
                                mt-2
                                flex
                                gap-2
                              ">

                                <input
                                  id={`reply-input-${comment._id}`}
                                  type="text"
                                  placeholder="Написать ответ..."
                                  value={
                                    replyTexts[
                                      comment._id
                                    ] || ''
                                  }
                                  onChange={(e) =>
                                    setReplyTexts(
                                      (prev) => ({
                                        ...prev,
                                        [comment._id]:
                                          e.target.value
                                      })
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      e.key ===
                                      'Enter'
                                    ) {
                                      handleReply(
                                        viewerPost._id,
                                        comment._id
                                      );
                                    }
                                  }}
                                  className="
                                    flex-1
                                    bg-transparent
                                    border-b
                                    border-white/10
                                    text-white
                                    text-xs
                                    outline-none
                                    pb-1
                                    placeholder:text-white/30
                                    focus:border-accent/50
                                    transition
                                  "
                                />

                                <button
                                  onClick={() =>
                                    handleReply(
                                      viewerPost._id,
                                      comment._id
                                    )
                                  }
                                  className="
                                    text-accent
                                    text-xs
                                    font-medium
                                    hover:opacity-80
                                    transition
                                  "
                                >
                                  Отправить
                                </button>

                              </div>

                              {comment.replies?.length > 0 && (

                                <div className="
                                  ml-11
                                  mt-3
                                  space-y-3
                                  border-l-2
                                  border-white/10
                                  pl-3
                                ">

                                  {comment.replies.map(
                                    (reply) => {

                                      const isReplyAuthor =
                                        currentUser?._id ===
                                        reply.user?._id;

                                      const isReplyEditing =
                                        editingCommentId ===
                                        reply._id;

                                      return (

                                        <div
                                          key={
                                            reply._id
                                          }
                                          className="
                                            flex
                                            gap-3
                                          "
                                        >

                                          <Link
                                            to={`/profile/${reply.user?._id}`}
                                            className="
                                              shrink-0
                                              hover:opacity-80
                                              transition
                                            "
                                          >

                                            <div className="
                                              w-6
                                              h-6
                                              rounded-full
                                              bg-gray-700
                                              flex
                                              items-center
                                              justify-center
                                              text-[10px]
                                              text-white
                                              overflow-hidden
                                            ">

                                              {reply.user?.avatar ? (

                                                <img
                                                  src={
                                                    reply.user.avatar
                                                  }
                                                  alt="Avatar"
                                                  className="
                                                    w-full
                                                    h-full
                                                    object-cover
                                                  "
                                                  crossOrigin="anonymous"
                                                />

                                              ) : (

                                                reply.user?.username
                                                  ?.charAt(0)
                                                  .toUpperCase()

                                              )}

                                            </div>

                                          </Link>

                                          <div className="flex-1">

                                            <div className="
                                              flex
                                              items-center
                                              gap-2
                                              flex-wrap
                                            ">

                                              <Link
                                                to={`/profile/${reply.user?._id}`}
                                                className="
                                                  text-white/40
                                                  text-[11px]
                                                  font-medium
                                                  hover:text-white
                                                  transition
                                                  inline-block
                                                "
                                              >
                                                @{reply.user?.username}
                                              </Link>

                                              {reply.user?.isVerified && (

                                                <span className="
                                                  text-blue-500
                                                  text-[10px]
                                                ">
                                                  ✓
                                                </span>

                                              )}

                                            </div>

                                            {isReplyEditing ? (

                                              <div className="
                                                mt-1
                                                flex
                                                flex-col
                                                gap-2
                                              ">

                                                <textarea
                                                  value={
                                                    editCommentText
                                                  }
                                                  onChange={(e) =>
                                                    setEditCommentText(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="
                                                    w-full
                                                    bg-black/40
                                                    border
                                                    border-white/10
                                                    text-white
                                                    rounded-lg
                                                    px-2
                                                    py-1
                                                    text-xs
                                                    outline-none
                                                    focus:ring-1
                                                    focus:ring-accent/50
                                                    resize-none
                                                  "
                                                  rows="2"
                                                />

                                                <div className="
                                                  flex
                                                  gap-2
                                                ">

                                                  <button
                                                    onClick={() => {
                                                      setEditingCommentId(
                                                        null
                                                      );
                                                      setEditCommentText(
                                                        ''
                                                      );
                                                    }}
                                                    className="
                                                      text-[10px]
                                                      text-white/50
                                                      hover:text-white
                                                    "
                                                  >
                                                    Отмена
                                                  </button>

                                                  <button
                                                    onClick={() =>
                                                      saveEditComment(
                                                        viewerPost._id,
                                                        reply._id,
                                                        true
                                                      )
                                                    }
                                                    className="
                                                      text-[10px]
                                                      text-accent
                                                      hover:opacity-80
                                                    "
                                                  >
                                                    Сохранить
                                                  </button>

                                                </div>

                                              </div>

                                            ) : (

                                              <p className="
                                                text-white/70
                                                text-sm
                                                mt-1
                                              ">
                                                {reply.text}
                                              </p>

                                            )}

                                            {isReplyAuthor &&
                                              !isReplyEditing && (

                                                <div className="
                                                  flex
                                                  items-center
                                                  gap-2
                                                  mt-1
                                                  text-white/20
                                                ">

                                                  <button
                                                    onClick={() =>
                                                      startEditComment(
                                                        reply._id,
                                                        reply.text
                                                      )
                                                    }
                                                    className="
                                                      hover:text-white
                                                      transition
                                                    "
                                                  >
                                                    <FaPencilAlt
                                                      size={10}
                                                    />
                                                  </button>

                                                  <button
                                                    onClick={() =>
                                                      deleteComment(
                                                        viewerPost._id,
                                                        reply._id,
                                                        true
                                                      )
                                                    }
                                                    className="
                                                      hover:text-red-400
                                                      transition
                                                    "
                                                  >
                                                    <FaTrash
                                                      size={10}
                                                    />
                                                  </button>

                                                </div>

                                              )}

                                          </div>

                                        </div>

                                      );
                                    }
                                  )}

                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>

                    <div className="
                      p-4
                      border-t
                      border-white/10
                      bg-[#0a0a0a]/90
                      backdrop-blur-md
                      z-10
                      shrink-0
                    ">

                      <div className="
                        flex
                        gap-2
                        bg-black/40
                        border
                        border-white/10
                        rounded-full
                        px-4
                        py-2
                        items-center
                      ">

                        <input
                          type="text"
                          placeholder="Добавить комментарий..."
                          value={commentText}
                          onChange={(e) =>
                            setCommentText(
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key ===
                              'Enter'
                            ) {
                              handleAddComment(
                                viewerPost._id
                              );
                            }
                          }}
                          className="
                            flex-1
                            bg-transparent
                            text-white
                            text-sm
                            outline-none
                            placeholder:text-white/30
                          "
                        />

                        <button
                          onClick={() =>
                            handleAddComment(
                              viewerPost._id
                            )
                          }
                          className="
                            text-accent
                            font-medium
                            text-sm
                            hover:opacity-80
                            transition
                          "
                        >
                          Опубликовать
                        </button>

                      </div>
                    </div>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>
          </motion.div>

        )}

      </AnimatePresence>

      {/* =====================================================
          EDIT USER
      ====================================================== */}

      <AnimatePresence>

        {editingUser && (

          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="
              fixed
              inset-0
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              z-50
              p-4
            "
          >

            <div className="
              bg-dark
              border
              border-white/10
              rounded-2xl
              p-6
              w-full
              max-w-md
            ">

              <h3 className="
                text-xl
                font-bold
                mb-4
              ">
                Редактировать {editingUser.username}
              </h3>

              <div className="
                space-y-3
              ">

                <input
                  value={
                    editingUser.username
                  }
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      username:
                        e.target.value
                    })
                  }
                  className="
                    w-full
                    bg-white/5
                    border
                    border-white/10
                    rounded-xl
                    p-3
                    outline-none
                  "
                  placeholder="Имя пользователя"
                />

                <textarea
                  value={
                    editingUser.bio || ''
                  }
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      bio:
                        e.target.value
                    })
                  }
                  className="
                    w-full
                    bg-white/5
                    border
                    border-white/10
                    rounded-xl
                    p-3
                    outline-none
                  "
                  placeholder="Био"
                  rows="3"
                />

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  <label className="
                    text-white/70
                    text-sm
                  ">
                    Верифицирован:
                  </label>

                  <input
                    type="checkbox"
                    checked={
                      editingUser.isVerified
                    }
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        isVerified:
                          e.target.checked
                      })
                    }
                    className="
                      w-5
                      h-5
                      accent-blue-500
                    "
                  />

                </div>

              </div>

              <div className="
                flex
                gap-2
                mt-4
              ">

                <button
                  onClick={() =>
                    setEditingUser(null)
                  }
                  className="
                    flex-1
                    py-2
                    bg-white/10
                    rounded-xl
                  "
                >
                  Отмена
                </button>

                <button
                  onClick={
                    handleUpdateUser
                  }
                  className="
                    flex-1
                    py-2
                    bg-blue-500
                    rounded-xl
                  "
                >
                  Сохранить
                </button>

              </div>

            </div>

          </motion.div>

        )}

        {/* =====================================================
            EDIT POST
        ====================================================== */}

        {editingPost && (

          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="
              fixed
              inset-0
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              z-50
              p-4
            "
          >

            <div className="
              bg-dark
              border
              border-white/10
              rounded-2xl
              p-6
              w-full
              max-w-md
            ">

              <h3 className="
                text-xl
                font-bold
                mb-4
              ">
                Редактировать пост
              </h3>

              <div className="
                space-y-3
              ">

                <textarea
                  value={
                    editingPost.content
                  }
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      content:
                        e.target.value
                    })
                  }
                  className="
                    w-full
                    bg-white/5
                    border
                    border-white/10
                    rounded-xl
                    p-3
                    outline-none
                    min-h-[100px]
                  "
                  placeholder="Текст поста"
                />

                {editMediaPreview && (

                  <div className="
                    relative
                    border
                    border-white/10
                    rounded-xl
                    overflow-hidden
                  ">

                    <img
                      src={
                        editMediaPreview
                      }
                      alt="Preview"
                      className="
                        w-full
                        max-h-40
                        object-contain
                      "
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setEditMediaFile(null);
                        setEditMediaPreview(null);

                        if (
                          editMediaInputRef.current
                        ) {
                          editMediaInputRef.current.value =
                            '';
                        }
                      }}
                      className="
                        absolute
                        top-2
                        right-2
                        bg-black/60
                        text-white
                        rounded-full
                        p-1
                        hover:bg-black/80
                      "
                    >
                      ✕
                    </button>

                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    editMediaInputRef.current?.click()
                  }
                  className="
                    w-full
                    py-2
                    bg-white/10
                    text-white
                    rounded-xl
                    hover:bg-white/20
                    transition
                  "
                >
                  {editMediaPreview
                    ? 'Заменить медиа'
                    : 'Добавить/Заменить медиа'}
                </button>

                <input
                  type="file"
                  ref={editMediaInputRef}
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file =
                      e.target.files[0];

                    if (file) {
                      setEditMediaFile(
                        file
                      );

                      setEditMediaPreview(
                        URL.createObjectURL(
                          file
                        )
                      );
                    }
                  }}
                  className="hidden"
                />

              </div>

              <div className="
                flex
                gap-2
                mt-4
              ">

                <button
                  onClick={() => {
                    setEditingPost(null);
                    setEditMediaFile(null);
                    setEditMediaPreview(null);
                  }}
                  className="
                    flex-1
                    py-2
                    bg-white/10
                    rounded-xl
                  "
                >
                  Отмена
                </button>

                <button
                  onClick={
                    handleUpdatePost
                  }
                  className="
                    flex-1
                    py-2
                    bg-blue-500
                    rounded-xl
                  "
                >
                  Сохранить
                </button>

              </div>

            </div>

          </motion.div>

        )}

        {/* =====================================================
            COMMENTS MODAL
        ====================================================== */}

        {commentsModalOpen && (

          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="
              fixed
              inset-0
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              z-50
              p-4
            "
          >

            <div className="
              bg-dark
              border
              border-white/10
              rounded-2xl
              p-6
              w-full
              max-w-2xl
              max-h-[80vh]
              flex
              flex-col
            ">

              <div className="
                flex
                justify-between
                items-center
                mb-4
              ">

                <h3 className="
                  text-xl
                  font-bold
                ">
                  Комментарии к посту
                </h3>

                <button
                  onClick={() =>
                    setCommentsModalOpen(false)
                  }
                  className="
                    text-white/50
                    hover:text-white
                  "
                >
                  ✕
                </button>

              </div>

              <div className="
                flex-1
                overflow-y-auto
                space-y-3
                pr-2
              ">

                {selectedPostComments.length === 0 && (

                  <p className="
                    text-white/40
                    text-center
                    mt-10
                  ">
                    Нет комментариев
                  </p>

                )}

                {selectedPostComments.map(
                  (comment) => (

                    <div
                      key={
                        comment._id
                      }
                      className="
                        flex
                        justify-between
                        items-start
                        p-3
                        bg-white/5
                        rounded-xl
                        border
                        border-white/5
                      "
                    >

                      <div>

                        <p className="
                          text-white/60
                          text-xs
                        ">
                          @{comment.user?.username}
                        </p>

                        <p className="
                          text-white
                          text-sm
                          mt-1
                        ">
                          {comment.text}
                        </p>

                      </div>

                      <div className="
                        flex
                        gap-2
                      ">

                        <button
                          onClick={() => {
                            setEditingComment(
                              comment
                            );

                            setCommentsModalOpen(
                              false
                            );

                            setEditCommentText(
                              comment.text || ''
                            );
                          }}
                          className="
                            text-blue-400
                            hover:text-blue-300
                            text-sm
                          "
                        >
                          ✎
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteComment(
                              comment._id
                            )
                          }
                          className="
                            text-red-400
                            hover:text-red-300
                            text-sm
                          "
                        >
                          🗑
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </motion.div>

        )}

        {/* =====================================================
            EDIT COMMENT
        ====================================================== */}

        {editingComment && (

          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="
              fixed
              inset-0
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              z-50
              p-4
            "
          >

            <div className="
              bg-dark
              border
              border-white/10
              rounded-2xl
              p-6
              w-full
              max-w-md
            ">

              <h3 className="
                text-xl
                font-bold
                mb-4
              ">
                Редактировать комментарий
              </h3>

              <textarea
                value={
                  editingComment.text
                }
                onChange={(e) =>
                  setEditingComment({
                    ...editingComment,
                    text:
                      e.target.value
                  })
                }
                className="
                  w-full
                  bg-white/5
                  border
                  border-white/10
                  rounded-xl
                  p-3
                  outline-none
                "
                rows="3"
              />

              <div className="
                flex
                gap-2
                mt-4
              ">

                <button
                  onClick={() => {
                    setEditingComment(
                      null
                    );

                    setEditCommentText(
                      ''
                    );

                    setCommentsModalOpen(
                      true
                    );
                  }}
                  className="
                    flex-1
                    py-2
                    bg-white/10
                    rounded-xl
                  "
                >
                  Отмена
                </button>

                <button
                  onClick={async () => {
                    await handleUpdateComment();
                    setCommentsModalOpen(
                      true
                    );
                  }}
                  className="
                    flex-1
                    py-2
                    bg-blue-500
                    rounded-xl
                  "
                >
                  Сохранить
                </button>

              </div>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;