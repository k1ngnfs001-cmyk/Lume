import {
  useEffect,
  useState,
  useRef
} from 'react';

import {
  useParams,
  Link,
  useNavigate
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext';

import axios from '../api/axios';

import {
  motion,
  AnimatePresence
} from 'framer-motion';

import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaPlay,
  FaChevronUp,
  FaChevronDown,
  FaBookmark,
  FaTrash,
  FaPencilAlt,
  FaReply
} from 'react-icons/fa';

import {
  FiBookmark,
  FiMoreVertical,
  FiEdit2
} from 'react-icons/fi';


const Profile = () => {
  const {
    id
  } = useParams();

  const {
    user: currentUser
  } = useAuth();

  const navigate = useNavigate();


  // =========================================================
  // PROFILE
  // =========================================================

  const [
    profileData,
    setProfileData
  ] = useState(null);

  const [
    isFollowing,
    setIsFollowing
  ] = useState(false);

  const [
    loading,
    setLoading
  ] = useState(true);


  // =========================================================
  // VIEWER
  // =========================================================

  const [
    viewerPost,
    setViewerPost
  ] = useState(null);

  const [
    viewerPosts,
    setViewerPosts
  ] = useState([]);

  const [
    viewerIndex,
    setViewerIndex
  ] = useState(0);

  const [
    isMuted,
    setIsMuted
  ] = useState(true);

  const [
    progress,
    setProgress
  ] = useState(0);

  const videoRef =
    useRef(null);


  // =========================================================
  // COMMENTS
  // =========================================================

  const [
    isCommentsOpen,
    setIsCommentsOpen
  ] = useState(false);

  const [
    commentText,
    setCommentText
  ] = useState('');

  const [
    replyTexts,
    setReplyTexts
  ] = useState({});

  const [
    editingCommentId,
    setEditingCommentId
  ] = useState(null);

  const [
    editCommentText,
    setEditCommentText
  ] = useState('');


  // =========================================================
  // POST EDIT
  // =========================================================

  const [
    isEditMenuOpen,
    setIsEditMenuOpen
  ] = useState(false);

  const [
    isEditModalOpen,
    setIsEditModalOpen
  ] = useState(false);

  const [
    editContent,
    setEditContent
  ] = useState('');

  const [
    editFile,
    setEditFile
  ] = useState(null);

  const [
    editPreview,
    setEditPreview
  ] = useState(null);

  const editFileInputRef =
    useRef(null);

  const [
    isUpdating,
    setIsUpdating
  ] = useState(false);

  const [
    editingPost,
    setEditingPost
  ] = useState(null);


  // =========================================================
  // GRID VIDEO HOVER
  // =========================================================

  const [
    hoveredId,
    setHoveredId
  ] = useState(null);

  const videoRefs =
    useRef({});


  // =========================================================
  // MEDIA URL
  // =========================================================

  const getMediaUrl = (url) => {
    if (!url) {
      return '';
    }

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    if (
      url.startsWith('/uploads')
    ) {
      return (
        'https://lume-5mof.onrender.com' +
        url
      );
    }

    return url;
  };


  // =========================================================
  // ID HELPERS
  // =========================================================

  const sameId = (a, b) => {
    if (a == null || b == null) {
      return false;
    }

    return String(
      a?._id ?? a
    ) === String(
      b?._id ?? b
    );
  };


  const isIdInArray = (
    arr,
    id
  ) => {
    if (!Array.isArray(arr)) {
      return false;
    }

    return arr.some(
      item => sameId(item, id)
    );
  };


  // =========================================================
  // LOAD PROFILE
  // IMPORTANT:
  // /users/profile/:id returns BOTH user and posts
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const res =
          await axios.get(
            `/users/profile/${id}`
          );

        if (cancelled) {
          return;
        }

        setProfileData(
          res.data
        );

        setIsFollowing(
          Boolean(
            res.data?.isFollowing
          )
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          'Ошибка загрузки профиля:',
          error
        );

        alert(
          'Ошибка загрузки профиля: ' +
          (
            error.response?.data?.message ||
            error.message
          )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);


  // =========================================================
  // GRID VIDEO HOVER
  // =========================================================

  useEffect(() => {
    Object.keys(
      videoRefs.current
    ).forEach((postId) => {
      const video =
        videoRefs.current[postId];

      if (!video) {
        return;
      }

      if (postId === hoveredId) {
        video.currentTime = 0;

        video
          .play()
          .catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [hoveredId]);


  // =========================================================
  // FOLLOW
  // =========================================================

  const handleFollow = async () => {
    if (
      !currentUser ||
      !id ||
      sameId(
        currentUser._id,
        id
      )
    ) {
      return;
    }

    try {
      const res =
        await axios.post(
          `/users/follow/${id}`
        );

      const nextFollowing =
        Boolean(
          res.data.isFollowing
        );

      setIsFollowing(
        nextFollowing
      );

      setProfileData(
        prev => {
          if (!prev) {
            return prev;
          }

          const oldFollowers =
            Array.isArray(
              prev.user?.followers
            )
              ? prev.user.followers
              : [];

          const nextFollowers =
            nextFollowing
              ? oldFollowers.some(
                  follower =>
                    sameId(
                      follower,
                      currentUser._id
                    )
                )
                ? oldFollowers
                : [
                    ...oldFollowers,
                    currentUser._id
                  ]
              : oldFollowers.filter(
                  follower =>
                    !sameId(
                      follower,
                      currentUser._id
                    )
                );

          return {
            ...prev,

            user: {
              ...prev.user,

              followers:
                nextFollowers
            }
          };
        }
      );
    } catch (error) {
      console.error(
        'Ошибка подписки:',
        error
      );

      alert(
        'Ошибка подписки: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    }
  };


  // =========================================================
  // OPEN VIEWER
  // =========================================================

  const openViewer = (post) => {
    if (!profileData) {
      return;
    }

    const posts =
      Array.isArray(
        profileData.posts
      )
        ? profileData.posts
        : [];

    const index =
      posts.findIndex(
        p =>
          sameId(
            p._id,
            post._id
          )
      );

    setViewerPosts(
      posts
    );

    setViewerIndex(
      index >= 0
        ? index
        : 0
    );

    setViewerPost(
      post
    );

    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    setIsEditMenuOpen(false);
    setIsUpdating(false);

    document.body.style.overflow =
      'hidden';
  };


  // =========================================================
  // CLOSE VIEWER
  // =========================================================

  const closeViewer = () => {
    setViewerPost(null);
    setViewerPosts([]);
    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    setIsEditMenuOpen(false);
    setIsEditModalOpen(false);
    setEditingPost(null);

    document.body.style.overflow =
      '';
  };


  // =========================================================
  // NEXT POST
  // =========================================================

  const goNext = () => {
    if (
      viewerIndex >=
      viewerPosts.length - 1
    ) {
      return;
    }

    const nextIndex =
      viewerIndex + 1;

    const nextPost =
      viewerPosts[nextIndex];

    setViewerIndex(
      nextIndex
    );

    setViewerPost(
      nextPost
    );

    setProgress(0);
    setIsCommentsOpen(false);
    setIsEditMenuOpen(false);
  };


  // =========================================================
  // PREVIOUS POST
  // =========================================================

  const goPrev = () => {
    if (
      viewerIndex <= 0
    ) {
      return;
    }

    const prevIndex =
      viewerIndex - 1;

    const prevPost =
      viewerPosts[prevIndex];

    setViewerIndex(
      prevIndex
    );

    setViewerPost(
      prevPost
    );

    setProgress(0);
    setIsCommentsOpen(false);
    setIsEditMenuOpen(false);
  };


  // =========================================================
  // VIEWER SCROLL
  // =========================================================

  useEffect(() => {
    if (!viewerPost) {
      return;
    }

    const handleScrollBlocker = (
      e
    ) => {
      const sidebar =
        document.getElementById(
          'lume-sidebar'
        );

      if (
        sidebar &&
        sidebar.contains(
          e.target
        )
      ) {
        return;
      }

      if (
        e.target.tagName ===
          'INPUT' ||
        e.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      e.preventDefault();

      const delta =
        e.deltaY ||
        e.wheelDelta ||
        0;

      if (
        Math.abs(delta) <
        50
      ) {
        return;
      }

      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    window.addEventListener(
      'wheel',
      handleScrollBlocker,
      {
        passive: false
      }
    );

    window.addEventListener(
      'touchmove',
      handleScrollBlocker,
      {
        passive: false
      }
    );

    return () => {
      window.removeEventListener(
        'wheel',
        handleScrollBlocker
      );

      window.removeEventListener(
        'touchmove',
        handleScrollBlocker
      );
    };
  }, [
    viewerPost,
    viewerIndex,
    viewerPosts.length
  ]);


  // =========================================================
  // KEYBOARD NAVIGATION
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (
      e
    ) => {
      if (
        e.target.tagName ===
          'INPUT' ||
        e.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      if (
        e.key ===
        'ArrowDown'
      ) {
        e.preventDefault();
        goNext();
      }

      if (
        e.key ===
        'ArrowUp'
      ) {
        e.preventDefault();
        goPrev();
      }

      if (
        e.key === 'Escape'
      ) {
        if (isEditModalOpen) {
          setIsEditModalOpen(
            false
          );
          return;
        }

        if (viewerPost) {
          closeViewer();
        }
      }

      if (
        e.key === ' '
      ) {
        e.preventDefault();
        handleVideoClick();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    viewerPost,
    viewerIndex,
    viewerPosts.length,
    isEditModalOpen
  ]);


  // =========================================================
  // UPDATE POST EVERYWHERE
  // =========================================================

  const updatePostEverywhere = (
    postId,
    updater
  ) => {
    setViewerPosts(
      prev =>
        prev.map(post =>
          sameId(
            post._id,
            postId
          )
            ? updater(post)
            : post
        )
    );

    setProfileData(
      prev => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,

          posts:
            Array.isArray(
              prev.posts
            )
              ? prev.posts.map(
                  post =>
                    sameId(
                      post._id,
                      postId
                    )
                      ? updater(post)
                      : post
                )
              : []
        };
      }
    );

    setViewerPost(
      prev =>
        prev &&
        sameId(
          prev._id,
          postId
        )
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
        post =>
          sameId(
            post._id,
            postId
          )
      ) ||
      (
        viewerPost &&
        sameId(
          viewerPost._id,
          postId
        )
          ? viewerPost
          : null
      );

    if (!targetPost) {
      return;
    }

    const wasLiked =
      Boolean(
        targetPost.isLikedByMe
      ) ||
      isIdInArray(
        targetPost.likes,
        currentUser._id
      );

    const originalPost =
      targetPost;

    setIsUpdating(true);

    updatePostEverywhere(
      postId,
      post => ({
        ...post,

        isLikedByMe:
          !wasLiked,

        likes:
          wasLiked
            ? (
                post.likes || []
              ).filter(
                id =>
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

      updatePostEverywhere(
        postId,
        post => ({
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
              : (
                  post.likes || []
                )
        })
      );
    } catch (error) {
      updatePostEverywhere(
        postId,
        () => originalPost
      );

      alert(
        'Ошибка лайка: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
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
        post =>
          sameId(
            post._id,
            postId
          )
      ) ||
      (
        viewerPost &&
        sameId(
          viewerPost._id,
          postId
        )
          ? viewerPost
          : null
      );

    if (!targetPost) {
      return;
    }

    const wasSaved =
      Boolean(
        targetPost.isSavedByMe
      ) ||
      isIdInArray(
        targetPost.savedBy,
        currentUser._id
      );

    const originalPost =
      targetPost;

    setIsUpdating(true);

    updatePostEverywhere(
      postId,
      post => ({
        ...post,

        isSavedByMe:
          !wasSaved,

        savedBy:
          wasSaved
            ? (
                post.savedBy ||
                []
              ).filter(
                id =>
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

      updatePostEverywhere(
        postId,
        post => ({
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
              : (
                  post.savedBy ||
                  []
                )
        })
      );
    } catch (error) {
      updatePostEverywhere(
        postId,
        () => originalPost
      );

      alert(
        'Ошибка сохранения: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    } finally {
      setIsUpdating(false);
    }
  };


  // =========================================================
  // ADD COMMENT
  // =========================================================

  const handleAddComment =
    async (postId) => {
      const text =
        commentText.trim();

      if (
        !text ||
        !postId
      ) {
        return;
      }

      try {
        const response =
          await axios.post(
            `/posts/${postId}/comment`,
            {
              text
            }
          );

        const newComment =
          response.data;

        setViewerPosts(
          prev =>
            prev.map(
              post =>
                sameId(
                  post._id,
                  postId
                )
                  ? {
                      ...post,

                      comments: [
                        ...(post.comments ||
                          []),
                        newComment
                      ]
                    }
                  : post
            )
        );

        setProfileData(
          prev => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,

              posts:
                prev.posts.map(
                  post =>
                    sameId(
                      post._id,
                      postId
                    )
                      ? {
                          ...post,

                          comments: [
                            ...(post.comments ||
                              []),
                            newComment
                          ]
                        }
                      : post
                )
            };
          }
        );

        setViewerPost(
          prev =>
            prev &&
            sameId(
              prev._id,
              postId
            )
              ? {
                  ...prev,

                  comments: [
                    ...(prev.comments ||
                      []),
                    newComment
                  ]
                }
              : prev
        );

        setCommentText('');
      } catch (error) {
        alert(
          'Ошибка добавления комментария: ' +
          (
            error.response?.data?.message ||
            error.message
          )
        );
      }
    };


  // =========================================================
  // LIKE COMMENT
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
        comments =>
          Array.isArray(comments)
            ? comments.map(
                comment =>
                  sameId(
                    comment._id,
                    commentId
                  )
                    ? updatedComment
                    : comment
              )
            : [];

      setViewerPost(
        prev =>
          prev &&
          sameId(
            prev._id,
            postId
          )
            ? {
                ...prev,

                comments:
                  updateComments(
                    prev.comments
                  )
              }
            : prev
      );

      setViewerPosts(
        prev =>
          prev.map(
            post =>
              sameId(
                post._id,
                postId
              )
                ? {
                    ...post,

                    comments:
                      updateComments(
                        post.comments
                      )
                  }
                : post
          )
      );

      setProfileData(
        prev => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,

            posts:
              prev.posts.map(
                post =>
                  sameId(
                    post._id,
                    postId
                  )
                    ? {
                        ...post,

                        comments:
                          updateComments(
                            post.comments
                          )
                      }
                    : post
              )
          };
        }
      );
    } catch (error) {
      alert(
        'Ошибка лайка комментария: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
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
      replyTexts[
        commentId
      ];

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
            text:
              text.trim()
          }
        );

      const {
        reply,
        commentId: parentId
      } = response.data;

      const updateReplies =
        comments =>
          Array.isArray(comments)
            ? comments.map(
                comment =>
                  sameId(
                    comment._id,
                    parentId
                  )
                    ? {
                        ...comment,

                        replies: [
                          ...(comment.replies ||
                            []),
                          reply
                        ]
                      }
                    : comment
              )
            : [];

      setViewerPost(
        prev =>
          prev &&
          sameId(
            prev._id,
            postId
          )
            ? {
                ...prev,

                comments:
                  updateReplies(
                    prev.comments
                  )
              }
            : prev
      );

      setViewerPosts(
        prev =>
          prev.map(
            post =>
              sameId(
                post._id,
                postId
              )
                ? {
                    ...post,

                    comments:
                      updateReplies(
                        post.comments
                      )
                  }
                : post
          )
      );

      setProfileData(
        prev => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,

            posts:
              prev.posts.map(
                post =>
                  sameId(
                    post._id,
                    postId
                  )
                    ? {
                        ...post,

                        comments:
                          updateReplies(
                            post.comments
                          )
                      }
                    : post
              )
          };
        }
      );

      setReplyTexts(
        prev => ({
          ...prev,

          [commentId]:
            ''
        })
      );
    } catch (error) {
      alert(
        'Ошибка добавления ответа: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    }
  };


  // =========================================================
  // START EDIT COMMENT
  // =========================================================

  const startEditComment = (
    commentId,
    currentText
  ) => {
    setEditingCommentId(
      commentId
    );

    setEditCommentText(
      currentText || ''
    );
  };


  // =========================================================
  // SAVE EDIT COMMENT
  // =========================================================

  const saveEditComment =
    async (
      postId,
      commentId,
      isReply = false
    ) => {
      const text =
        editCommentText.trim();

      if (!text) {
        return;
      }

      try {
        const response =
          await axios.put(
            `/posts/${postId}/comments/${commentId}`,
            {
              text,
              isReply
            }
          );

        const serverComment =
          response.data.comment;

        const updateComments =
          comments => {
            if (!Array.isArray(
              comments
            )) {
              return [];
            }

            if (!isReply) {
              return comments.map(
                comment =>
                  sameId(
                    comment._id,
                    commentId
                  )
                    ? serverComment
                    : comment
              );
            }

            return comments.map(
              comment => ({
                ...comment,

                replies:
                  Array.isArray(
                    comment.replies
                  )
                    ? comment.replies.map(
                        reply =>
                          sameId(
                            reply._id,
                            commentId
                          )
                            ? serverComment
                            : reply
                      )
                    : []
              })
            );
          };

        setViewerPost(
          prev =>
            prev &&
            sameId(
              prev._id,
              postId
            )
              ? {
                  ...prev,

                  comments:
                    updateComments(
                      prev.comments
                    )
                }
              : prev
        );

        setViewerPosts(
          prev =>
            prev.map(
              post =>
                sameId(
                  post._id,
                  postId
                )
                  ? {
                      ...post,

                      comments:
                        updateComments(
                          post.comments
                        )
                    }
                  : post
            )
        );

        setProfileData(
          prev => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,

              posts:
                prev.posts.map(
                  post =>
                    sameId(
                      post._id,
                      postId
                    )
                      ? {
                          ...post,

                          comments:
                            updateComments(
                              post.comments
                            )
                        }
                      : post
                )
            };
          }
        );

        setEditingCommentId(
          null
        );

        setEditCommentText(
          ''
        );
      } catch (error) {
        alert(
          'Ошибка редактирования: ' +
          (
            error.response?.data?.message ||
            error.message
          )
        );
      }
    };


  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const deleteComment = async (
    postId,
    commentId,
    isReply = false
  ) => {
    if (
      !window.confirm(
        'Вы уверены, что хотите удалить этот комментарий?'
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `/posts/${postId}/comments/${commentId}`,
        {
          data: {
            isReply
          }
        }
      );

      const filterComments =
        comments => {
          if (
            !Array.isArray(
              comments
            )
          ) {
            return [];
          }

          if (isReply) {
            return comments.map(
              comment => ({
                ...comment,

                replies:
                  Array.isArray(
                    comment.replies
                  )
                    ? comment.replies.filter(
                        reply =>
                          !sameId(
                            reply._id,
                            commentId
                          )
                      )
                    : []
              })
            );
          }

          return comments.filter(
            comment =>
              !sameId(
                comment._id,
                commentId
              )
          );
        };

      setViewerPost(
        prev =>
          prev &&
          sameId(
            prev._id,
            postId
          )
            ? {
                ...prev,

                comments:
                  filterComments(
                    prev.comments
                  )
              }
            : prev
      );

      setViewerPosts(
        prev =>
          prev.map(
            post =>
              sameId(
                post._id,
                postId
              )
                ? {
                    ...post,

                    comments:
                      filterComments(
                        post.comments
                      )
                  }
                : post
          )
      );

      setProfileData(
        prev => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,

            posts:
              prev.posts.map(
                post =>
                  sameId(
                    post._id,
                    postId
                  )
                    ? {
                        ...post,

                        comments:
                          filterComments(
                            post.comments
                          )
                      }
                    : post
              )
          };
        }
      );
    } catch (error) {
      alert(
        'Ошибка удаления: ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    }
  };


  // =========================================================
  // MUTE
  // =========================================================

  const toggleMute = (
    e
  ) => {
    e.stopPropagation();

    setIsMuted(
      prev => !prev
    );
  };


  // =========================================================
  // VIDEO CLICK
  // =========================================================

  const handleVideoClick = () => {
    if (!videoRef.current) {
      return;
    }

    if (
      videoRef.current.paused
    ) {
      videoRef.current
        .play()
        .catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };


  // =========================================================
  // VIDEO PROGRESS
  // =========================================================

  const handleTimeUpdate =
    () => {
      if (
        !videoRef.current
      ) {
        return;
      }

      const currentTime =
        videoRef.current
          .currentTime;

      const duration =
        videoRef.current
          .duration;

      if (
        duration &&
        duration > 0
      ) {
        setProgress(
          (
            currentTime /
            duration
          ) * 100
        );
      }
    };


  // =========================================================
  // VIEWER EDIT MENU
  // =========================================================

  const openEditMenu = (
    e
  ) => {
    e.stopPropagation();

    setIsEditMenuOpen(
      prev => !prev
    );
  };


  const closeEditMenu =
    () => {
      setIsEditMenuOpen(
        false
      );
    };


  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = () => {
    if (!viewerPost) {
      return;
    }

    setEditingPost(
      null
    );

    setEditContent(
      viewerPost.content ||
        ''
    );

    setEditFile(null);
    setEditPreview(null);
    setIsEditModalOpen(
      true
    );

    closeEditMenu();
  };


  // =========================================================
  // OPEN EDIT FROM GRID
  // =========================================================

  const openEditModalFromGrid =
    (post) => {
      setEditingPost(
        post
      );

      setEditContent(
        post.content || ''
      );

      setEditFile(null);
      setEditPreview(null);

      setIsEditModalOpen(
        true
      );
    };


  // =========================================================
  // EDIT MEDIA
  // =========================================================

  const handleEditFileChange =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      setEditFile(
        file
      );

      if (editPreview) {
        URL.revokeObjectURL(
          editPreview
        );
      }

      setEditPreview(
        URL.createObjectURL(
          file
        )
      );
    };


  // =========================================================
  // UPDATE POST
  // =========================================================

  const handleUpdatePost =
    async () => {
      const post =
        editingPost ||
        viewerPost;

      if (
        !post ||
        !editContent.trim() ||
        isUpdating
      ) {
        return;
      }

      setIsUpdating(
        true
      );

      const formData =
        new FormData();

      formData.append(
        'content',
        editContent.trim()
      );

      if (editFile) {
        formData.append(
          'media',
          editFile
        );
      }

      try {
        const response =
          await axios.put(
            `/posts/${post._id}`,
            formData
          );

        const updatedPost = {
          ...post,
          ...response.data,

          isLikedByMe:
            response.data
              .isLikedByMe ??
            post.isLikedByMe,

          isSavedByMe:
            response.data
              .isSavedByMe ??
            post.isSavedByMe
        };

        setViewerPosts(
          prev =>
            prev.map(
              item =>
                sameId(
                  item._id,
                  post._id
                )
                  ? updatedPost
                  : item
            )
        );

        setProfileData(
          prev => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,

              posts:
                prev.posts.map(
                  item =>
                    sameId(
                      item._id,
                      post._id
                    )
                      ? updatedPost
                      : item
                )
            };
          }
        );

        setViewerPost(
          prev =>
            prev &&
            sameId(
              prev._id,
              post._id
            )
              ? updatedPost
              : prev
        );

        setIsEditModalOpen(
          false
        );

        setIsEditMenuOpen(
          false
        );

        setEditingPost(
          null
        );

        setEditFile(
          null
        );

        if (editPreview) {
          URL.revokeObjectURL(
            editPreview
          );
        }

        setEditPreview(
          null
        );
      } catch (error) {
        alert(
          'Ошибка обновления: ' +
          (
            error.response?.data?.message ||
            error.message
          )
        );
      } finally {
        setIsUpdating(
          false
        );
      }
    };


  // =========================================================
  // REMOVE OBJECT URL ON UNMOUNT
  // =========================================================

  useEffect(() => {
    return () => {
      if (editPreview) {
        URL.revokeObjectURL(
          editPreview
        );
      }

      document.body.style.overflow =
        '';
    };
  }, [editPreview]);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="text-center p-10 text-white/50">
        Загрузка профиля...
      </div>
    );
  }


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!profileData) {
    return (
      <div className="text-center p-10 text-white/50">
        Пользователь не найден
      </div>
    );
  }


  const {
    user,
    posts = []
  } = profileData;


  const isOwnProfile =
    sameId(
      currentUser?._id,
      id
    );


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full h-full relative">

      {/* =====================================================
          VIEWER
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
            className="fixed top-0 right-0 bottom-0 left-[260px] z-50 bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
          >

            <div
              className="flex flex-row items-center justify-center gap-4 md:gap-8 w-full h-full max-w-[1000px] mx-auto px-4"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* CLOSE */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeViewer();
                }}
                className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 bg-black/60 rounded-full backdrop-blur-sm transition"
              >
                ✕
              </button>


              <div
                className={`flex flex-row items-center justify-center gap-4 md:gap-8 transition-all duration-300 ease-in-out w-full ${
                  isCommentsOpen
                    ? 'translate-x-[-180px]'
                    : 'translate-x-0'
                }`}
              >

                {/* =================================================
                    MEDIA
                ================================================== */}

                <div className="flex-1 flex items-center justify-center min-w-0 h-full">

                  <div className="relative w-full max-w-[450px] lg:max-w-[650px] aspect-[1/1] max-h-[85vh] rounded-[24px] overflow-hidden bg-black shadow-2xl cursor-pointer">

                    {/* MUTE */}
                    <button
                      onClick={toggleMute}
                      className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition"
                    >
                      {isMuted
                        ? '🔇'
                        : '🔊'}
                    </button>


                    {/* TOP ACTIONS */}
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">

                      {currentUser &&
                        sameId(
                          currentUser._id,
                          viewerPost.user?._id
                        ) && (
                          <>
                            <button
                              onClick={
                                openEditMenu
                              }
                              className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition"
                            >
                              <FiMoreVertical
                                size={20}
                              />
                            </button>

                            <AnimatePresence>
                              {isEditMenuOpen && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    scale: 0.8,
                                    y: -10
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    y: -10
                                  }}
                                  className="absolute right-0 top-12 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[140px] shadow-2xl"
                                >
                                  <button
                                    onClick={
                                      openEditModal
                                    }
                                    className="flex items-center gap-2 w-full px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition"
                                  >
                                    <FiEdit2
                                      size={16}
                                    />

                                    <span className="text-sm">
                                      Изменить
                                    </span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}

                      <button
                        onClick={(
                          e
                        ) => {
                          e.stopPropagation();
                          closeViewer();
                        }}
                        className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition"
                      >
                        ✕
                      </button>

                    </div>


                    {/* MEDIA */}
                    <div
                      onClick={
                        handleVideoClick
                      }
                      className="w-full h-full relative"
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
                          className="w-full h-full relative"
                        >

                          {viewerPost.mediaUrl ? (

                            viewerPost.mediaType ===
                            'video' ? (

                              <video
                                ref={
                                  videoRef
                                }
                                src={getMediaUrl(
                                  viewerPost.mediaUrl
                                )}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                playsInline
                                muted={
                                  isMuted
                                }
                                onTimeUpdate={
                                  handleTimeUpdate
                                }
                              />

                            ) : (

                              <img
                                src={getMediaUrl(
                                  viewerPost.mediaUrl
                                )}
                                className="w-full h-full object-cover"
                                alt="Post"
                              />

                            )

                          ) : (

                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/30 text-4xl font-bold text-center p-4">
                              {
                                viewerPost.content
                              }
                            </div>

                          )}


                          {/* GRADIENT */}
                          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-b-[24px]" />


                          {/* AUTHOR */}
                          <div className="absolute bottom-6 left-4 z-10 text-left">

                            <Link
                              to={`/profile/${viewerPost.user?._id}`}
                              className="inline-flex items-center gap-3 mb-2 hover:opacity-80 transition"
                            >

                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">

                                {viewerPost.user?.avatar ? (

                                  <img
                                    src={
                                      viewerPost.user.avatar
                                    }
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                  />

                                ) : (

                                  viewerPost.user?.username
                                    ?.charAt(0)
                                    .toUpperCase()

                                )}

                              </div>

                              <span className="text-white font-bold text-base drop-shadow-lg flex items-center gap-1">
                                @{viewerPost.user?.username}

                                {viewerPost.user?.isVerified && (
                                  <span className="text-blue-500 text-lg ml-1">
                                    ✓
                                  </span>
                                )}
                              </span>

                            </Link>

                            <p className="text-white/90 text-sm drop-shadow-md leading-relaxed max-w-[80%]">
                              {viewerPost.content}
                            </p>

                          </div>


                          {/* PROGRESS */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20 pointer-events-none">
                            <div
                              className="h-full bg-red-500 transition-all duration-100 ease-linear"
                              style={{
                                width: `${progress}%`
                              }}
                            />
                          </div>

                        </motion.div>

                      </AnimatePresence>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    ACTIONS
                ================================================== */}

                <div className="flex flex-col items-center gap-4 py-4 shrink-0 min-w-[60px] md:min-w-[80px]">

                  {/* AVATAR */}
                  <div className="relative">

                    <Link
                      to={`/profile/${viewerPost.user?._id}`}
                    >
                      <div className="w-12 h-12 rounded-full border-[2px] border-white/30 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition">

                        {viewerPost.user?.avatar ? (

                          <img
                            src={
                              viewerPost.user.avatar
                            }
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          <span className="text-white font-bold text-lg">
                            {viewerPost.user?.username
                              ?.charAt(
                                0
                              )
                              .toUpperCase()}
                          </span>

                        )}

                      </div>
                    </Link>

                    {viewerPost.user?._id !==
                      currentUser?._id && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer hover:scale-110 transition">
                        +
                      </div>
                    )}

                  </div>


                  {/* LIKE */}
                  <div
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    onClick={() =>
                      handleLike(
                        viewerPost._id
                      )
                    }
                  >

                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">

                      <span
                        className={`text-xl transition-colors ${
                          viewerPost.isLikedByMe ||
                          isIdInArray(
                            viewerPost.likes,
                            currentUser?._id
                          )
                            ? 'text-red-500'
                            : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {viewerPost.isLikedByMe ||
                        isIdInArray(
                          viewerPost.likes,
                          currentUser?._id
                        ) ? (
                          <FaHeart />
                        ) : (
                          <FaRegHeart />
                        )}
                      </span>

                    </div>

                    <span className="text-white/80 text-[11px] font-bold tracking-wide">
                      {Array.isArray(
                        viewerPost.likes
                      )
                        ? viewerPost.likes.length
                        : 0}
                    </span>

                  </div>


                  {/* COMMENTS */}
                  <div
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    onClick={(
                      e
                    ) => {
                      e.stopPropagation();

                      setIsCommentsOpen(
                        prev => !prev
                      );
                    }}
                  >

                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">

                      <FaComment className="text-white/80 text-xl hover:text-white transition" />

                    </div>

                    <span className="text-white/80 text-[11px] font-bold tracking-wide">
                      {Array.isArray(
                        viewerPost.comments
                      )
                        ? viewerPost.comments.length
                        : 0}
                    </span>

                  </div>


                  {/* SAVE */}
                  <div
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    onClick={(
                      e
                    ) => {
                      e.stopPropagation();

                      handleSave(
                        viewerPost._id
                      );
                    }}
                  >

                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">

                      {viewerPost.isSavedByMe ||
                      isIdInArray(
                        viewerPost.savedBy,
                        currentUser?._id
                      ) ? (
                        <FaBookmark className="text-yellow-400 text-xl transition-colors" />
                      ) : (
                        <FiBookmark className="text-white/80 text-xl hover:text-white transition-colors" />
                      )}

                    </div>

                    <span className="text-white/80 text-[11px] font-bold tracking-wide">
                      {Array.isArray(
                        viewerPost.savedBy
                      )
                        ? viewerPost.savedBy.length
                        : 0}
                    </span>

                  </div>


                  {/* NAVIGATION */}
                  <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3 w-full items-center">

                    <button
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      disabled={
                        viewerIndex === 0
                      }
                      className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"
                    >
                      <FaChevronUp
                        size={16}
                      />
                    </button>

                    <button
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      disabled={
                        viewerIndex ===
                        viewerPosts.length -
                          1
                      }
                      className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"
                    >
                      <FaChevronDown
                        size={16}
                      />
                    </button>

                  </div>

                </div>

              </div>


              {/* ===================================================
                  COMMENTS PANEL
              ==================================================== */}

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
                    className="absolute right-0 top-0 bottom-0 w-[420px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-40 p-6 flex flex-col shadow-2xl"
                  >

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">

                      <span className="text-white font-bold text-lg">
                        Комментарии
                      </span>

                      <button
                        onClick={(
                          e
                        ) => {
                          e.stopPropagation();

                          setIsCommentsOpen(
                            false
                          );
                        }}
                        className="text-white/50 hover:text-white transition text-xl"
                      >
                        ✕
                      </button>

                    </div>


                    {/* COMMENTS */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-20 custom-scrollbar">

                      {(!viewerPost.comments ||
                        viewerPost.comments.length === 0) && (
                        <p className="text-white/40 text-center mt-10">
                          Нет комментариев
                        </p>
                      )}

                      {viewerPost.comments?.map(
                        comment => {

                          const isCommentAuthor =
                            sameId(
                              currentUser?._id,
                              comment.user?._id
                            );

                          const isPostAuthor =
                            sameId(
                              currentUser?._id,
                              viewerPost.user?._id
                            );

                          const isCommentLiked =
                            isIdInArray(
                              comment.likes,
                              currentUser?._id
                            );

                          return (
                            <div
                              key={
                                comment._id
                              }
                              className="border-b border-white/5 pb-4"
                            >

                              {/* COMMENT HEADER */}
                              <div className="flex gap-3 mb-2">

                                <Link
                                  to={`/profile/${comment.user?._id}`}
                                  className="shrink-0 hover:opacity-80 transition"
                                >

                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white overflow-hidden">

                                    {comment.user?.avatar ? (

                                      <img
                                        src={
                                          comment.user.avatar
                                        }
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                      />

                                    ) : (

                                      comment.user?.username
                                        ?.charAt(
                                          0
                                        )
                                        .toUpperCase()

                                    )}

                                  </div>

                                </Link>


                                <div className="flex-1">

                                  <div className="flex items-center gap-2 flex-wrap">

                                    <Link
                                      to={`/profile/${comment.user?._id}`}
                                      className="text-white/60 text-xs font-medium hover:text-white transition inline-block"
                                    >
                                      @{comment.user?.username}
                                    </Link>

                                    {isPostAuthor && (
                                      <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                        Автор
                                      </span>
                                    )}

                                    {comment.user?.isVerified && (
                                      <span className="text-blue-500 text-xs">
                                        ✓
                                      </span>
                                    )}

                                  </div>


                                  {/* COMMENT TEXT */}
                                  {editingCommentId ===
                                  comment._id ? (

                                    <div className="mt-1 flex flex-col gap-2">

                                      <textarea
                                        value={
                                          editCommentText
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          setEditCommentText(
                                            e.target.value
                                          )
                                        }
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                                        rows="2"
                                      />

                                      <div className="flex gap-2">

                                        <button
                                          onClick={() => {
                                            setEditingCommentId(
                                              null
                                            );

                                            setEditCommentText(
                                              ''
                                            );
                                          }}
                                          className="text-xs text-white/50 hover:text-white"
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
                                          className="text-xs text-accent hover:opacity-80"
                                        >
                                          Сохранить
                                        </button>

                                      </div>

                                    </div>

                                  ) : (

                                    <p className="text-white/80 text-sm mt-1">
                                      {
                                        comment.text
                                      }
                                    </p>

                                  )}

                                </div>

                              </div>


                              {/* COMMENT ACTIONS */}
                              <div className="flex items-center gap-4 ml-11 mt-1">

                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() =>
                                    handleCommentLike(
                                      viewerPost._id,
                                      comment._id
                                    )
                                  }
                                >

                                  <span
                                    className={`text-sm transition-colors ${
                                      isCommentLiked
                                        ? 'text-red-500'
                                        : 'text-white/40 hover:text-white'
                                    }`}
                                  >
                                    {isCommentLiked ? (
                                      <FaHeart />
                                    ) : (
                                      <FaRegHeart />
                                    )}
                                  </span>

                                  <span className="text-xs text-white/40">
                                    {comment.likes?.length > 0
                                      ? comment.likes.length
                                      : ''}
                                  </span>

                                </div>


                                <div
                                  className="flex items-center gap-1 cursor-pointer text-white/40 hover:text-white transition text-xs"
                                  onClick={() => {
                                    const input =
                                      document.getElementById(
                                        `reply-input-${comment._id}`
                                      );

                                    input?.focus();
                                  }}
                                >
                                  <FaReply size={12} />
                                  <span>
                                    Ответить
                                  </span>
                                </div>


                                {isCommentAuthor &&
                                  !editingCommentId && (
                                    <div className="flex items-center gap-2 text-white/30 ml-auto">

                                      <button
                                        onClick={() =>
                                          startEditComment(
                                            comment._id,
                                            comment.text
                                          )
                                        }
                                        className="hover:text-white transition"
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
                                        className="hover:text-red-400 transition"
                                      >
                                        <FaTrash
                                          size={12}
                                        />
                                      </button>

                                    </div>
                                  )}

                              </div>


                              {/* REPLY INPUT */}
                              <div className="ml-11 mt-2 flex gap-2">

                                <input
                                  id={`reply-input-${comment._id}`}
                                  type="text"
                                  placeholder="Написать ответ..."
                                  value={
                                    replyTexts[
                                      comment._id
                                    ] || ''
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setReplyTexts(
                                      prev => ({
                                        ...prev,

                                        [comment._id]:
                                          e.target.value
                                      })
                                    )
                                  }
                                  onKeyDown={(
                                    e
                                  ) => {
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
                                  className="flex-1 bg-transparent border-b border-white/10 text-white text-xs outline-none pb-1 placeholder:text-white/30 focus:border-accent/50 transition"
                                />

                                <button
                                  onClick={() =>
                                    handleReply(
                                      viewerPost._id,
                                      comment._id
                                    )
                                  }
                                  className="text-accent text-xs font-medium hover:opacity-80 transition"
                                >
                                  Отправить
                                </button>

                              </div>


                              {/* REPLIES */}
                              {comment.replies?.length >
                                0 && (

                                <div className="ml-11 mt-3 space-y-3 border-l-2 border-white/10 pl-3">

                                  {comment.replies.map(
                                    reply => {

                                      const isReplyAuthor =
                                        sameId(
                                          currentUser?._id,
                                          reply.user?._id
                                        );

                                      const isReplyEditing =
                                        editingCommentId ===
                                        reply._id;

                                      return (
                                        <div
                                          key={
                                            reply._id
                                          }
                                          className="flex gap-3"
                                        >

                                          <Link
                                            to={`/profile/${reply.user?._id}`}
                                            className="shrink-0 hover:opacity-80 transition"
                                          >

                                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white overflow-hidden">

                                              {reply.user?.avatar ? (

                                                <img
                                                  src={
                                                    reply.user.avatar
                                                  }
                                                  alt="Avatar"
                                                  className="w-full h-full object-cover"
                                                />

                                              ) : (

                                                reply.user?.username
                                                  ?.charAt(
                                                    0
                                                  )
                                                  .toUpperCase()

                                              )}

                                            </div>

                                          </Link>


                                          <div className="flex-1">

                                            <div className="flex items-center gap-2 flex-wrap">

                                              <Link
                                                to={`/profile/${reply.user?._id}`}
                                                className="text-white/40 text-[11px] font-medium hover:text-white transition inline-block"
                                              >
                                                @{reply.user?.username}
                                              </Link>

                                              {reply.user?.isVerified && (
                                                <span className="text-blue-500 text-[10px]">
                                                  ✓
                                                </span>
                                              )}

                                            </div>


                                            {isReplyEditing ? (

                                              <div className="mt-1 flex flex-col gap-2">

                                                <textarea
                                                  value={
                                                    editCommentText
                                                  }
                                                  onChange={(
                                                    e
                                                  ) =>
                                                    setEditCommentText(
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                                                  rows="2"
                                                />

                                                <div className="flex gap-2">

                                                  <button
                                                    onClick={() => {
                                                      setEditingCommentId(
                                                        null
                                                      );

                                                      setEditCommentText(
                                                        ''
                                                      );
                                                    }}
                                                    className="text-[10px] text-white/50 hover:text-white"
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
                                                    className="text-[10px] text-accent hover:opacity-80"
                                                  >
                                                    Сохранить
                                                  </button>

                                                </div>

                                              </div>

                                            ) : (

                                              <p className="text-white/70 text-sm mt-1">
                                                {
                                                  reply.text
                                                }
                                              </p>

                                            )}


                                            {isReplyAuthor &&
                                              !isReplyEditing && (
                                                <div className="flex items-center gap-2 mt-1 text-white/20">

                                                  <button
                                                    onClick={() =>
                                                      startEditComment(
                                                        reply._id,
                                                        reply.text
                                                      )
                                                    }
                                                    className="hover:text-white transition"
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
                                                    className="hover:text-red-400 transition"
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


                    {/* COMMENT INPUT */}
                    <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md z-10 shrink-0">

                      <div className="flex gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 items-center">

                        <input
                          type="text"
                          placeholder="Добавить комментарий..."
                          value={
                            commentText
                          }
                          onChange={(
                            e
                          ) =>
                            setCommentText(
                              e.target.value
                            )
                          }
                          onKeyDown={(
                            e
                          ) => {
                            if (
                              e.key ===
                              'Enter'
                            ) {
                              handleAddComment(
                                viewerPost._id
                              );
                            }
                          }}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                        />

                        <button
                          onClick={() =>
                            handleAddComment(
                              viewerPost._id
                            )
                          }
                          className="text-accent font-medium text-sm hover:opacity-80 transition"
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
          PROFILE PAGE
      ====================================================== */}

      {!viewerPost && (
        <div className="max-w-4xl mx-auto p-4 md:p-6">

          {/* PROFILE HEADER */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8 text-center">

            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-accent to-glow overflow-hidden mb-4 border-2 border-white/20">

              {user.avatar ? (

                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />

              ) : (

                <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold">
                  {user.username
                    ?.charAt(
                      0
                    )
                    .toUpperCase()}
                </div>

              )}

            </div>


            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">

              {user.displayName ||
                user.username}

              {user.isVerified && (
                <span className="text-blue-500 text-2xl">
                  ✓
                </span>
              )}

            </h2>


            <p className="text-white/50 text-sm mb-1">
              @{user.username}
            </p>


            <p className="text-white/50 text-sm mb-4">
              {user.bio ||
                'Пока ничего о себе не написал...'}
            </p>


            <div className="flex justify-center gap-8 text-sm mb-6">

              <div>
                <span className="text-white font-bold">
                  {user.followers?.length ||
                    0}
                </span>

                <span className="text-white/50 ml-1">
                  подписчиков
                </span>
              </div>


              <div>
                <span className="text-white font-bold">
                  {user.following?.length ||
                    0}
                </span>

                <span className="text-white/50 ml-1">
                  подписок
                </span>
              </div>

            </div>


            <div className="flex justify-center gap-3">

              {isOwnProfile ? (

                <button
                  onClick={() =>
                    navigate(
                      '/profile/edit'
                    )
                  }
                  className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                >
                  Редактировать профиль
                </button>

              ) : (

                <>
                  <button
                    onClick={
                      handleFollow
                    }
                    className={`px-6 py-2 rounded-xl font-semibold transition ${
                      isFollowing
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-accent text-white hover:bg-accent/80'
                    }`}
                  >
                    {isFollowing
                      ? 'Отписаться'
                      : 'Подписаться'}
                  </button>


                  <Link
                    to={`/chats/${user._id}`}
                    className="px-6 py-2 bg-white/5 border border-white/20 text-white rounded-xl hover:bg-white/10 transition"
                  >
                    💬 Написать
                  </Link>
                </>

              )}

            </div>

          </div>


          {/* =================================================
              POSTS GRID
          ================================================== */}

          <div className="grid grid-cols-3 gap-1 md:gap-2">

            {posts.length ===
              0 && (
              <div className="col-span-3 text-center text-white/40 py-10">
                У пользователя пока нет постов.
              </div>
            )}


            {posts.map(
              post => {
                const isVideo =
                  post.mediaType ===
                  'video';

                return (
                  <motion.div
                    key={
                      post._id
                    }
                    onClick={() =>
                      openViewer(
                        post
                      )
                    }
                    whileHover={{
                      scale: 1.02
                    }}
                    className="relative aspect-[1/1] bg-black/40 border border-white/5 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                  >

                    {/* =======================================
                        THREE DOTS / EDIT
                    ======================================== */}

                    {isOwnProfile && (
                      <div
                        className="absolute top-2 right-2 z-20 cursor-pointer bg-black/60 backdrop-blur-sm hover:bg-black/80 p-1 rounded-full transition"
                        onClick={(
                          e
                        ) => {
                          e.stopPropagation();

                          openEditModalFromGrid(
                            post
                          );
                        }}
                      >
                        <FiMoreVertical
                          size={18}
                          className="text-white/80 hover:text-white"
                        />
                      </div>
                    )}


                    {/* =======================================
                        MEDIA
                    ======================================== */}

                    {post.mediaUrl ? (

                      isVideo ? (

                        <video
                          ref={(el) => {
                            if (el) {
                              videoRefs.current[
                                post._id
                              ] = el;
                            }
                          }}
                          src={getMediaUrl(
                            post.mediaUrl
                          )}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onMouseEnter={() =>
                            setHoveredId(
                              post._id
                            )
                          }
                          onMouseLeave={() =>
                            setHoveredId(
                              null
                            )
                          }
                          onEnded={(e) => {
                            if (
                              hoveredId ===
                              post._id
                            ) {
                              e.target.currentTime = 0;

                              e.target
                                .play()
                                .catch(
                                  () => {}
                                );
                            }
                          }}
                        />

                      ) : (

                        <img
                          src={getMediaUrl(
                            post.mediaUrl
                          )}
                          className="w-full h-full object-cover"
                          alt="Post"
                        />

                      )

                    ) : (

                      <div className="w-full h-full flex items-center justify-center p-4 text-center bg-black/40">

                        <p className="text-white/90 text-sm font-medium line-clamp-5 whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                      </div>

                    )}


                    {/* LIKE COUNT */}
                    {post.likes?.length >
                      0 && (
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-white/90 text-xs font-semibold drop-shadow-lg">

                        <FaHeart
                          size={14}
                        />

                        <span>
                          {
                            post
                              .likes
                              .length
                          }
                        </span>

                      </div>
                    )}

                  </motion.div>
                );
              }
            )}

          </div>

        </div>
      )}


      {/* =====================================================
          EDIT POST MODAL
      ====================================================== */}

      <AnimatePresence>

        {isEditModalOpen && (
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() =>
              setIsEditModalOpen(
                false
              )
            }
          >

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.96
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >

              <h3 className="text-xl font-bold text-white mb-4">
                Редактировать пост
              </h3>


              <div className="space-y-4">

                <textarea
                  autoFocus
                  value={
                    editContent
                  }
                  onChange={(
                    e
                  ) =>
                    setEditContent(
                      e.target.value
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 resize-none min-h-[100px] placeholder:text-white/30"
                  placeholder="Описание поста..."
                />


                {editPreview && (
                  <div className="relative border border-white/10 rounded-xl overflow-hidden">

                    {editFile?.type?.startsWith(
                      'video/'
                    ) ? (

                      <video
                        src={
                          editPreview
                        }
                        controls
                        className="w-full max-h-60 object-contain bg-black"
                      />

                    ) : (

                      <img
                        src={
                          editPreview
                        }
                        alt="Preview"
                        className="w-full max-h-60 object-contain bg-black"
                      />

                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditFile(
                          null
                        );

                        if (
                          editPreview
                        ) {
                          URL.revokeObjectURL(
                            editPreview
                          );
                        }

                        setEditPreview(
                          null
                        );

                        if (
                          editFileInputRef.current
                        ) {
                          editFileInputRef.current.value =
                            '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      ✕
                    </button>

                  </div>
                )}


                <button
                  type="button"
                  onClick={() =>
                    editFileInputRef.current?.click()
                  }
                  className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                >
                  {editPreview
                    ? 'Заменить медиа'
                    : 'Добавить/Заменить медиа'}
                </button>


                <input
                  type="file"
                  ref={
                    editFileInputRef
                  }
                  accept="image/*,video/*"
                  onChange={
                    handleEditFileChange
                  }
                  className="hidden"
                />

              </div>


              <div className="flex gap-2 mt-6">

                <button
                  onClick={() => {
                    setIsEditModalOpen(
                      false
                    );

                    setEditingPost(
                      null
                    );
                  }}
                  className="flex-1 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                >
                  Отмена
                </button>


                <button
                  onClick={
                    handleUpdatePost
                  }
                  disabled={
                    isUpdating ||
                    !editContent.trim()
                  }
                  className="flex-1 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating
                    ? 'Сохранение...'
                    : 'Сохранить'}
                </button>

              </div>

            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};


export default Profile;