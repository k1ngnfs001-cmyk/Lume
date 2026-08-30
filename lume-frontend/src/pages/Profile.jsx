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

import {
  useAlert
} from '../context/AlertContext';

import axios from '../api/axios';

import {
  motion,
  AnimatePresence
} from 'framer-motion';

import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
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
    user: currentUser,
    setUser
  } = useAuth();


  const {
    showAlert
  } = useAlert();


  const navigate =
    useNavigate();


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


  const [
    isPlaying,
    setIsPlaying
  ] = useState(true);


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
  // EDIT POST
  // =========================================================

  const [
    isEditModalOpen,
    setIsEditModalOpen
  ] = useState(false);


  const [
    editingPost,
    setEditingPost
  ] = useState(null);


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


  // =========================================================
  // GRID MENU
  // =========================================================

  const [
    openGridMenuId,
    setOpenGridMenuId
  ] = useState(null);


  // =========================================================
  // HELPERS
  // =========================================================

  const getMediaUrl = (
    url
  ) => {

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


  const sameId = (
    a,
    b
  ) => {

    if (
      a == null ||
      b == null
    ) {
      return false;
    }


    return String(
      a?._id || a
    ) === String(
      b?._id || b
    );

  };


  const isIdInArray = (
    arr,
    id
  ) => {

    return (
      Array.isArray(arr) &&
      arr.some(
        item =>
          sameId(
            item,
            id
          )
      )
    );

  };


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {

    let cancelled =
      false;


    const fetchProfile =
      async () => {

        try {

          setLoading(
            true
          );


          const response =
            await axios.get(
              `/users/profile/${id}`
            );


          if (
            cancelled
          ) {
            return;
          }


          const data =
            response.data;


          setProfileData(
            data
          );


          setIsFollowing(
            Boolean(
              data.isFollowing
            )
          );

        } catch (error) {

          if (
            cancelled
          ) {
            return;
          }


          console.error(
            'Ошибка загрузки профиля:',
            error
          );


          showAlert({
            title:
              'Ошибка',

            message:
              error.response?.data?.message ||
              'Не удалось загрузить профиль'
          });

        } finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );

          }

        }

      };


    if (id) {
      fetchProfile();
    }


    return () => {

      cancelled =
        true;

    };

  }, [
    id
  ]);


  // =========================================================
  // SHARE PROFILE
  // =========================================================

  const handleShareProfile =
    async () => {

      if (
        !profileData?.user?._id
      ) {
        return;
      }


      const profileUser =
        profileData.user;


      const shareUrl =
        `${window.location.origin}/profile/${profileUser._id}`;


      const shareText =
        `Посмотри профиль @${profileUser.username} в Lume`;


      // -------------------------------------------------------
      // REGISTER SHARE ON SERVER
      // -------------------------------------------------------

      try {

        await axios.post(
          `/users/profile/${profileUser._id}/share`
        );

      } catch (error) {

        console.error(
          'Ошибка регистрации share профиля:',
          error
        );

      }


      // -------------------------------------------------------
      // NATIVE SHARE
      // -------------------------------------------------------

      if (
        typeof navigator !==
          'undefined' &&
        typeof navigator.share ===
          'function'
      ) {

        try {

          await navigator.share({

            title:
              `@${profileUser.username} в Lume`,

            text:
              shareText,

            url:
              shareUrl

          });


          return;

        } catch (error) {

          if (
            error?.name ===
            'AbortError'
          ) {
            return;
          }

        }

      }


      // -------------------------------------------------------
      // CLIPBOARD
      // -------------------------------------------------------

      try {

        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {

          await navigator.clipboard.writeText(
            shareUrl
          );

        } else {

          const textarea =
            document.createElement(
              'textarea'
            );


          textarea.value =
            shareUrl;


          textarea.style.position =
            'fixed';


          textarea.style.opacity =
            '0';


          document.body.appendChild(
            textarea
          );


          textarea.focus();
          textarea.select();


          document.execCommand(
            'copy'
          );


          document.body.removeChild(
            textarea
          );

        }


        showAlert({

          title:
            'Ссылка скопирована',

          message:
            'Ссылка на профиль скопирована в буфер обмена.'

        });

      } catch (error) {

        console.error(
          'Ошибка копирования:',
          error
        );


        showAlert({

          title:
            'Ссылка на профиль',

          message:
            shareUrl

        });

      }

    };


  // =========================================================
  // FOLLOW
  // =========================================================

  const handleFollow =
    async () => {

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

        const response =
          await axios.post(
            `/users/follow/${id}`
          );


        const following =
          Boolean(
            response.data.isFollowing
          );


        setIsFollowing(
          following
        );


        setProfileData(
          prev => {

            if (!prev) {
              return prev;
            }


            const profileUser =
              prev.user;


            const followers =
              Array.isArray(
                profileUser.followers
              )
                ? profileUser.followers
                : [];


            const nextFollowers =
              following

                ? followers.some(
                    follower =>
                      sameId(
                        follower,
                        currentUser._id
                      )
                  )
                  ? followers
                  : [
                      ...followers,
                      currentUser._id
                    ]

                : followers.filter(
                    follower =>
                      !sameId(
                        follower,
                        currentUser._id
                      )
                  );


            return {

              ...prev,

              user: {
                ...profileUser,

                followers:
                  nextFollowers

              }

            };

          }
        );


        setUser(
          prev => {

            if (!prev) {
              return prev;
            }


            const followingList =
              Array.isArray(
                prev.following
              )
                ? prev.following
                : [];


            const nextFollowing =
              following

                ? followingList.some(
                    followingId =>
                      sameId(
                        followingId,
                        id
                      )
                  )
                  ? followingList
                  : [
                      ...followingList,
                      id
                    ]

                : followingList.filter(
                    followingId =>
                      !sameId(
                        followingId,
                        id
                      )
                  );


            const updatedUser = {

              ...prev,

              following:
                nextFollowing

            };


            localStorage.setItem(
              'lumeUser',
              JSON.stringify(
                updatedUser
              )
            );


            return updatedUser;

          }
        );


      } catch (error) {

        showAlert({
          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка подписки'
        });

      }

    };


  // =========================================================
  // OPEN VIEWER
  // =========================================================

  const openViewer = (
    post
  ) => {

    const posts =
      profileData?.posts ||
      [];


    const index =
      posts.findIndex(
        item =>
          sameId(
            item._id,
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


    setProgress(
      0
    );


    setIsMuted(
      true
    );


    setIsPlaying(
      true
    );


    setIsCommentsOpen(
      false
    );


    setOpenGridMenuId(
      null
    );


    document.body.style.overflow =
      'hidden';

  };


  // =========================================================
  // CLOSE VIEWER
  // =========================================================

  const closeViewer =
    () => {

      setViewerPost(
        null
      );

      setViewerPosts(
        []
      );

      setViewerIndex(
        0
      );

      setProgress(
        0
      );

      setIsMuted(
        true
      );

      setIsPlaying(
        true
      );

      setIsCommentsOpen(
        false
      );


      document.body.style.overflow =
        '';

    };


  // =========================================================
  // NEXT
  // =========================================================

  const goNext =
    () => {

      if (
        viewerIndex >=
        viewerPosts.length - 1
      ) {
        return;
      }


      const index =
        viewerIndex + 1;


      setViewerIndex(
        index
      );


      setViewerPost(
        viewerPosts[index]
      );


      setProgress(
        0
      );


      setIsPlaying(
        true
      );


      setIsCommentsOpen(
        false
      );

    };


  // =========================================================
  // PREVIOUS
  // =========================================================

  const goPrev =
    () => {

      if (
        viewerIndex <= 0
      ) {
        return;
      }


      const index =
        viewerIndex - 1;


      setViewerIndex(
        index
      );


      setViewerPost(
        viewerPosts[index]
      );


      setProgress(
        0
      );


      setIsPlaying(
        true
      );


      setIsCommentsOpen(
        false
      );

    };


  // =========================================================
  // LIKE
  // =========================================================

  const handleLike =
    async (
      postId
    ) => {

      if (
        !currentUser?._id
      ) {
        return;
      }


      const target =
        viewerPosts.find(
          post =>
            sameId(
              post._id,
              postId
            )
        ) ||
        viewerPost;


      if (!target) {
        return;
      }


      const wasLiked =
        Boolean(
          target.isLikedByMe
        ) ||
        isIdInArray(
          target.likes,
          currentUser._id
        );


      const updatePost =
        post => ({

          ...post,

          isLikedByMe:
            !wasLiked,

          likes:
            wasLiked

              ? (
                  post.likes ||
                  []
                ).filter(
                  like =>
                    !sameId(
                      like,
                      currentUser._id
                    )
                )

              : [
                  ...(post.likes || []),
                  currentUser._id
                ]

        });


      setViewerPost(
        prev =>
          prev &&
          sameId(
            prev._id,
            postId
          )
            ? updatePost(prev)
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
                ? updatePost(post)
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
              (
                prev.posts ||
                []
              ).map(
                post =>
                  sameId(
                    post._id,
                    postId
                  )
                    ? updatePost(post)
                    : post
              )

          };

        }
      );


      try {

        const response =
          await axios.post(
            `/posts/${postId}/like`
          );


        const serverUpdate =
          post => ({

            ...post,

            isLikedByMe:
              Boolean(
                response.data.isLiked
              ),

            likes:
              Array.isArray(
                response.data.likes
              )
                ? response.data.likes
                : post.likes || []

          });


        setViewerPost(
          prev =>
            prev &&
            sameId(
              prev._id,
              postId
            )
              ? serverUpdate(prev)
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
                  ? serverUpdate(post)
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
                (
                  prev.posts ||
                  []
                ).map(
                  post =>
                    sameId(
                      post._id,
                      postId
                    )
                      ? serverUpdate(post)
                      : post
                )

            };

          }
        );


      } catch (error) {

        console.error(
          'Ошибка лайка:',
          error
        );

      }

    };


  // =========================================================
  // SAVE
  // =========================================================

  const handleSave =
    async (
      postId
    ) => {

      if (
        !currentUser?._id
      ) {
        return;
      }


      const target =
        viewerPosts.find(
          post =>
            sameId(
              post._id,
              postId
            )
        ) ||
        viewerPost;


      if (!target) {
        return;
      }


      const wasSaved =
        Boolean(
          target.isSavedByMe
        ) ||
        isIdInArray(
          target.savedBy,
          currentUser._id
        );


      const updatePost =
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

        });


      setViewerPost(
        prev =>
          prev &&
          sameId(
            prev._id,
            postId
          )
            ? updatePost(prev)
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
                ? updatePost(post)
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
              (
                prev.posts ||
                []
              ).map(
                post =>
                  sameId(
                    post._id,
                    postId
                  )
                    ? updatePost(post)
                    : post
              )

          };

        }
      );


      try {

        const response =
          await axios.post(
            `/posts/${postId}/save`
          );


        const serverUpdate =
          post => ({

            ...post,

            isSavedByMe:
              Boolean(
                response.data.isSaved
              ),

            savedBy:
              Array.isArray(
                response.data.savedBy
              )
                ? response.data.savedBy
                : post.savedBy || []

          });


        setViewerPost(
          prev =>
            prev &&
            sameId(
              prev._id,
              postId
            )
              ? serverUpdate(prev)
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
                  ? serverUpdate(post)
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
                (
                  prev.posts ||
                  []
                ).map(
                  post =>
                    sameId(
                      post._id,
                      postId
                    )
                      ? serverUpdate(post)
                      : post
                )

            };

          }
        );


      } catch (error) {

        console.error(
          'Ошибка сохранения:',
          error
        );

      }

    };


  // =========================================================
  // SHARE POST
  // =========================================================

  const handleShare =
    async (
      post
    ) => {

      if (
        !post?._id
      ) {
        return;
      }


      const shareUrl =
        `${window.location.origin}/post/${post._id}`;


      const username =
        post.user?.username ||
        'user';


      const shareText =
        post.content?.trim()
          ? post.content.trim()
          : `Посмотри этот пост @${username} в Lume`;


      // -------------------------------------------------------
      // REGISTER SHARE
      // -------------------------------------------------------

      try {

        await axios.post(
          `/posts/${post._id}/share`
        );

      } catch (error) {

        console.error(
          'Ошибка регистрации share:',
          error
        );

      }


      // -------------------------------------------------------
      // NATIVE SHARE
      // -------------------------------------------------------

      if (
        typeof navigator !==
          'undefined' &&
        typeof navigator.share ===
          'function'
      ) {

        try {

          await navigator.share({

            title:
              `Пост @${username} в Lume`,

            text:
              shareText,

            url:
              shareUrl

          });


          return;

        } catch (error) {

          if (
            error?.name ===
            'AbortError'
          ) {
            return;
          }

        }

      }


      // -------------------------------------------------------
      // COPY LINK
      // -------------------------------------------------------

      try {

        await navigator.clipboard.writeText(
          shareUrl
        );


        showAlert({

          title:
            'Ссылка скопирована',

          message:
            'Ссылка на пост скопирована в буфер обмена.'

        });

      } catch (error) {

        showAlert({

          title:
            'Ссылка на пост',

          message:
            shareUrl

        });

      }

    };


  // =========================================================
  // ADD COMMENT
  // =========================================================

  const handleAddComment =
    async (
      postId
    ) => {

      const text =
        commentText.trim();


      if (
        !text
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


        const updatePost =
          post => {

            if (
              !sameId(
                post._id,
                postId
              )
            ) {
              return post;
            }


            return {

              ...post,

              comments: [
                ...(post.comments || []),
                newComment
              ]

            };

          };


        setViewerPost(
          prev =>
            prev
              ? updatePost(prev)
              : prev
        );


        setViewerPosts(
          prev =>
            prev.map(
              updatePost
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
                (
                  prev.posts ||
                  []
                ).map(
                  updatePost
                )

            };

          }
        );


        setCommentText(
          ''
        );

      } catch (error) {

        showAlert({

          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка добавления комментария'

        });

      }

    };


  // =========================================================
  // COMMENT LIKE
  // =========================================================

  const handleCommentLike =
    async (
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


        const updatePost =
          post => {

            if (
              !sameId(
                post._id,
                postId
              )
            ) {
              return post;
            }


            return {

              ...post,

              comments:
                (
                  post.comments ||
                  []
                ).map(
                  comment =>
                    sameId(
                      comment._id,
                      commentId
                    )
                      ? updatedComment
                      : comment
                )

            };

          };


        setViewerPost(
          prev =>
            prev
              ? updatePost(prev)
              : prev
        );


        setViewerPosts(
          prev =>
            prev.map(
              updatePost
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
                (
                  prev.posts ||
                  []
                ).map(
                  updatePost
                )

            };

          }
        );

      } catch (error) {

        showAlert({

          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка лайка комментария'

        });

      }

    };


  // =========================================================
  // REPLY
  // =========================================================

  const handleReply =
    async (
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


        const reply =
          response.data.reply;


        const updatePost =
          post => {

            if (
              !sameId(
                post._id,
                postId
              )
            ) {
              return post;
            }


            return {

              ...post,

              comments:
                (
                  post.comments ||
                  []
                ).map(
                  comment =>
                    sameId(
                      comment._id,
                      commentId
                    )

                      ? {

                          ...comment,

                          replies: [
                            ...(comment.replies || []),
                            reply
                          ]

                        }

                      : comment
                )

            };

          };


        setViewerPost(
          prev =>
            prev
              ? updatePost(prev)
              : prev
        );


        setViewerPosts(
          prev =>
            prev.map(
              updatePost
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
                (
                  prev.posts ||
                  []
                ).map(
                  updatePost
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

        showAlert({

          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка добавления ответа'

        });

      }

    };


  // =========================================================
  // EDIT COMMENT
  // =========================================================

  const startEditComment =
    (
      commentId,
      currentText
    ) => {

      setEditingCommentId(
        commentId
      );

      setEditCommentText(
        currentText ||
        ''
      );

    };


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


        const updatedComment =
          response.data.comment;


        const updatePost =
          post => {

            if (
              !sameId(
                post._id,
                postId
              )
            ) {
              return post;
            }


            if (
              !isReply
            ) {

              return {

                ...post,

                comments:
                  (
                    post.comments ||
                    []
                  ).map(
                    comment =>
                      sameId(
                        comment._id,
                        commentId
                      )
                        ? updatedComment
                        : comment
                  )

              };

            }


            return {

              ...post,

              comments:
                (
                  post.comments ||
                  []
                ).map(
                  comment => ({

                    ...comment,

                    replies:
                      (
                        comment.replies ||
                        []
                      ).map(
                        reply =>
                          sameId(
                            reply._id,
                            commentId
                          )
                            ? updatedComment
                            : reply
                      )

                  })
                )

            };

          };


        setViewerPost(
          prev =>
            prev
              ? updatePost(prev)
              : prev
        );


        setViewerPosts(
          prev =>
            prev.map(
              updatePost
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
                (
                  prev.posts ||
                  []
                ).map(
                  updatePost
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

        showAlert({

          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка редактирования'

        });

      }

    };


  // =========================================================
  // DELETE COMMENT
  // =========================================================

  const deleteComment =
    (
      postId,
      commentId,
      isReply = false
    ) => {

      showAlert({

        title:
          'Удаление комментария',

        message:
          'Вы уверены, что хотите удалить этот комментарий?',

        confirmText:
          'Удалить',

        cancelText:
          'Отмена',

        showCancel:
          true,

        onConfirm:
          async () => {

            try {

              await axios.delete(
                `/posts/${postId}/comments/${commentId}`,
                {
                  data: {
                    isReply
                  }
                }
              );


              const updatePost =
                post => {

                  if (
                    !sameId(
                      post._id,
                      postId
                    )
                  ) {
                    return post;
                  }


                  if (
                    isReply
                  ) {

                    return {

                      ...post,

                      comments:
                        (
                          post.comments ||
                          []
                        ).map(
                          comment => ({

                            ...comment,

                            replies:
                              (
                                comment.replies ||
                                []
                              ).filter(
                                reply =>
                                  !sameId(
                                    reply._id,
                                    commentId
                                  )
                              )

                          })
                        )

                    };

                  }


                  return {

                    ...post,

                    comments:
                      (
                        post.comments ||
                        []
                      ).filter(
                        comment =>
                          !sameId(
                            comment._id,
                            commentId
                          )
                      )

                  };

                };


              setViewerPost(
                prev =>
                  prev
                    ? updatePost(prev)
                    : prev
              );


              setViewerPosts(
                prev =>
                  prev.map(
                    updatePost
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
                      (
                        prev.posts ||
                        []
                      ).map(
                        updatePost
                      )

                  };

                }
              );

            } catch (error) {

              showAlert({

                title:
                  'Ошибка',

                message:
                  error.response?.data?.message ||
                  'Ошибка удаления комментария'

              });

            }

          }

      });

    };


  // =========================================================
  // EDIT POST
  // =========================================================

  const openEditPost =
    (
      post
    ) => {

      setEditingPost(
        post
      );

      setEditContent(
        post.content ||
          ''
      );

      setEditFile(
        null
      );

      setEditPreview(
        null
      );

      setIsEditModalOpen(
        true
      );

      setOpenGridMenuId(
        null
      );

    };


  const handleEditFile =
    e => {

      const file =
        e.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        editPreview
      ) {

        URL.revokeObjectURL(
          editPreview
        );

      }


      setEditFile(
        file
      );


      setEditPreview(
        URL.createObjectURL(
          file
        )
      );

    };


  const handleUpdatePost =
    async () => {

      const post =
        editingPost ||
        viewerPost;


      if (
        !post ||
        !editContent.trim()
      ) {
        return;
      }


      setIsUpdating(
        true
      );


      try {

        const formData =
          new FormData();


        formData.append(
          'content',
          editContent.trim()
        );


        if (
          editFile
        ) {

          formData.append(
            'media',
            editFile
          );

        }


        const response =
          await axios.put(
            `/posts/${post._id}`,
            formData
          );


        const updatedPost = {

          ...post,
          ...response.data,

          isLikedByMe:
            response.data.isLikedByMe ??
            post.isLikedByMe,

          isSavedByMe:
            response.data.isSavedByMe ??
            post.isSavedByMe

        };


        const replacePost =
          item =>
            sameId(
              item._id,
              post._id
            )
              ? updatedPost
              : item;


        setProfileData(
          prev => {

            if (!prev) {
              return prev;
            }


            return {

              ...prev,

              posts:
                (
                  prev.posts ||
                  []
                ).map(
                  replacePost
                )

            };

          }
        );


        setViewerPosts(
          prev =>
            prev.map(
              replacePost
            )
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


        setEditingPost(
          null
        );


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


        showAlert({

          title:
            'Успех',

          message:
            'Пост успешно обновлён.'

        });


      } catch (error) {

        showAlert({

          title:
            'Ошибка',

          message:
            error.response?.data?.message ||
            'Ошибка обновления поста'

        });

      } finally {

        setIsUpdating(
          false
        );

      }

    };


  // =========================================================
  // DELETE POST
  // =========================================================

  const handleDeletePost =
    (
      postId
    ) => {

      showAlert({

        title:
          'Удаление поста',

        message:
          'Вы уверены, что хотите удалить этот пост?',

        confirmText:
          'Удалить',

        cancelText:
          'Отмена',

        showCancel:
          true,

        onConfirm:
          async () => {

            try {

              await axios.delete(
                `/posts/${postId}`
              );


              setProfileData(
                prev => {

                  if (!prev) {
                    return prev;
                  }


                  return {

                    ...prev,

                    posts:
                      (
                        prev.posts ||
                        []
                      ).filter(
                        post =>
                          !sameId(
                            post._id,
                            postId
                          )
                      )

                  };

                }
              );


              setViewerPosts(
                prev =>
                  prev.filter(
                    post =>
                      !sameId(
                        post._id,
                        postId
                      )
                  )
              );


              if (
                viewerPost &&
                sameId(
                  viewerPost._id,
                  postId
                )
              ) {

                closeViewer();

              }


              setOpenGridMenuId(
                null
              );


              showAlert({

                title:
                  'Пост удалён',

                message:
                  'Пост успешно удалён.'

              });

            } catch (error) {

              showAlert({

                title:
                  'Ошибка',

                message:
                  error.response?.data?.message ||
                  'Ошибка удаления поста'

              });

            }

          }

      });

    };


  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading
  ) {

    return (

      <div className="
        min-h-screen
        bg-dark
        flex
        items-center
        justify-center
        text-white/50
      ">
        Загрузка профиля...
      </div>

    );

  }


  if (
    !profileData?.user
  ) {

    return (

      <div className="
        min-h-screen
        bg-dark
        flex
        items-center
        justify-center
        text-white/50
      ">
        Пользователь не найден
      </div>

    );

  }


  const profileUser =
    profileData.user;


  const posts =
    profileData.posts || [];


  const isOwnProfile =
    sameId(
      currentUser?._id,
      profileUser._id
    );


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="
      min-h-screen
      bg-dark
      text-white
      p-4
      md:p-8
    ">


      {/* =====================================================
          PROFILE HEADER
      ====================================================== */}

      <div className="
        max-w-4xl
        mx-auto
      ">

        <div className="
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          rounded-3xl
          p-6
          md:p-8
          mb-8
        ">

          <div className="
            flex
            flex-col
            md:flex-row
            items-center
            gap-6
          ">

            {/* AVATAR */}

            <div className="
              w-28
              h-28
              md:w-32
              md:h-32
              rounded-full
              bg-gray-800
              border-2
              border-white/10
              overflow-hidden
              flex
              items-center
              justify-center
              shrink-0
            ">

              {profileUser.avatar ? (

                <img
                  src={
                    profileUser.avatar
                  }
                  alt="Avatar"
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                />

              ) : (

                <span className="
                  text-white
                  text-4xl
                  font-bold
                ">
                  {profileUser.username
                    ?.charAt(0)
                    .toUpperCase()}
                </span>

              )}

            </div>


            {/* INFO */}

            <div className="
              flex-1
              text-center
              md:text-left
              min-w-0
            ">

              <div className="
                flex
                flex-col
                md:flex-row
                md:items-center
                gap-1
                md:gap-3
              ">

                <h1 className="
                  text-2xl
                  md:text-3xl
                  font-bold
                ">
                  {profileUser.displayName ||
                    profileUser.username}
                </h1>


                {profileUser.isVerified && (

                  <span className="
                    text-blue-500
                    font-bold
                  ">
                    ✓
                  </span>

                )}

              </div>


              <p className="
                text-white/50
                text-sm
                mt-1
              ">
                @{profileUser.username}
              </p>


              <p className="
                text-white/70
                text-sm
                mt-3
                whitespace-pre-wrap
                break-words
              ">
                {profileUser.bio ||
                  'Пока ничего о себе не написал...'}
              </p>


              <div className="
                flex
                justify-center
                md:justify-start
                gap-6
                mt-5
              ">

                <div className="text-center">

                  <div className="
                    text-white
                    font-bold
                  ">
                    {posts.length}
                  </div>

                  <div className="
                    text-white/40
                    text-xs
                  ">
                    постов
                  </div>

                </div>


                <div className="text-center">

                  <div className="
                    text-white
                    font-bold
                  ">
                    {profileUser.followers?.length ||
                      0}
                  </div>

                  <div className="
                    text-white/40
                    text-xs
                  ">
                    подписчиков
                  </div>

                </div>


                <div className="text-center">

                  <div className="
                    text-white
                    font-bold
                  ">
                    {profileUser.following?.length ||
                      0}
                  </div>

                  <div className="
                    text-white/40
                    text-xs
                  ">
                    подписок
                  </div>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="
                flex
                flex-wrap
                justify-center
                md:justify-start
                gap-3
                mt-5
              ">

                {isOwnProfile ? (

                  <button
                    onClick={() =>
                      navigate(
                        '/profile/edit'
                      )
                    }
                    className="
                      px-5
                      py-2.5
                      bg-white/10
                      border
                      border-white/10
                      rounded-xl
                      hover:bg-white/15
                      transition
                      text-sm
                      font-medium
                    "
                  >
                    Редактировать профиль
                  </button>

                ) : (

                  <>

                    <button
                      onClick={
                        handleFollow
                      }
                      className={`
                        px-5
                        py-2.5
                        rounded-xl
                        transition
                        text-sm
                        font-semibold

                        ${
                          isFollowing
                            ? 'bg-white/10 hover:bg-white/15'
                            : 'bg-accent hover:bg-accent/80'
                        }
                      `}
                    >
                      {isFollowing
                        ? 'Отписаться'
                        : 'Подписаться'}
                    </button>


                    <Link
                      to={`/chats/${profileUser._id}`}
                      className="
                        px-5
                        py-2.5
                        bg-white/10
                        border
                        border-white/10
                        rounded-xl
                        hover:bg-white/15
                        transition
                        text-sm
                        font-medium
                      "
                    >
                      Написать
                    </Link>

                  </>

                )}


                {/* SHARE PROFILE */}

                <button
                  onClick={
                    handleShareProfile
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    px-5
                    py-2.5
                    bg-white/10
                    border
                    border-white/10
                    rounded-xl
                    hover:bg-white/15
                    transition
                    text-sm
                    font-medium
                  "
                >

                  <FaShare
                    size={14}
                  />

                  <span>
                    Поделиться
                  </span>

                </button>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            POSTS
        ==================================================== */}

        {posts.length ===
          0 ? (

          <div className="
            text-center
            text-white/40
            py-20
          ">
            У пользователя пока нет постов.
          </div>

        ) : (

          <div className="
            grid
            grid-cols-3
            gap-1
            md:gap-2
          ">

            {posts.map(
              post => (

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
                    scale:
                      1.01
                  }}
                  className="
                    relative
                    aspect-square
                    bg-black/40
                    border
                    border-white/5
                    rounded-lg
                    overflow-hidden
                    cursor-pointer
                  "
                >

                  {/* GRID MENU */}

                  {isOwnProfile && (

                    <div
                      className="
                        absolute
                        top-2
                        right-2
                        z-20
                      "
                      onClick={e =>
                        e.stopPropagation()
                      }
                    >

                      <button
                        onClick={() =>
                          setOpenGridMenuId(
                            prev =>
                              prev ===
                              post._id
                                ? null
                                : post._id
                          )
                        }
                        className="
                          w-8
                          h-8
                          rounded-full
                          bg-black/60
                          backdrop-blur-md
                          border
                          border-white/10
                          flex
                          items-center
                          justify-center
                        "
                      >

                        <FiMoreVertical
                          className="
                            text-white
                          "
                        />

                      </button>


                      {openGridMenuId ===
                        post._id && (

                        <div className="
                          absolute
                          top-10
                          right-0
                          w-32
                          bg-black/95
                          border
                          border-white/10
                          rounded-xl
                          p-1
                          shadow-2xl
                        ">

                          <button
                            onClick={() =>
                              openEditPost(
                                post
                              )
                            }
                            className="
                              flex
                              items-center
                              gap-2
                              w-full
                              px-3
                              py-2
                              rounded-lg
                              hover:bg-white/10
                              text-sm
                            "
                          >

                            <FiEdit2
                              size={14}
                            />

                            Изменить

                          </button>


                          <button
                            onClick={() =>
                              handleDeletePost(
                                post._id
                              )
                            }
                            className="
                              flex
                              items-center
                              gap-2
                              w-full
                              px-3
                              py-2
                              rounded-lg
                              hover:bg-red-500/10
                              text-red-400
                              text-sm
                            "
                          >

                            <FaTrash
                              size={13}
                            />

                            Удалить

                          </button>

                        </div>

                      )}

                    </div>

                  )}


                  {/* MEDIA */}

                  {post.mediaUrl ? (

                    post.mediaType ===
                    'video' ? (

                      <video
                        src={
                          getMediaUrl(
                            post.mediaUrl
                          )
                        }
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                        muted
                        playsInline
                        preload="metadata"
                      />

                    ) : (

                      <img
                        src={
                          getMediaUrl(
                            post.mediaUrl
                          )
                        }
                        alt="Post"
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                      />

                    )

                  ) : (

                    <div className="
                      w-full
                      h-full
                      bg-black/40
                      flex
                      items-center
                      justify-center
                      p-5
                      text-center
                    ">

                      <p className="
                        text-white/80
                        text-sm
                        line-clamp-6
                      ">
                        {post.content}
                      </p>

                    </div>

                  )}


                  {post.likes?.length >
                    0 && (

                    <div className="
                      absolute
                      bottom-2
                      left-2
                      text-white
                      text-xs
                      flex
                      items-center
                      gap-1
                      drop-shadow-lg
                    ">

                      <FaHeart
                        className="
                          text-red-500
                        "
                      />

                      {post.likes.length}

                    </div>

                  )}

                </motion.div>

              )
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          VIEWER
      ====================================================== */}

      <AnimatePresence>

        {viewerPost && (

          <motion.div
            initial={{
              opacity:
                0
            }}
            animate={{
              opacity:
                1
            }}
            exit={{
              opacity:
                0
            }}
            className="
              fixed
              inset-0
              z-[9999]
              bg-[#0a0a0a]
              flex
              items-center
              justify-center
              overflow-hidden
            "
          >

            {/* CLOSE */}

            <button
              onClick={
                closeViewer
              }
              className="
                absolute
                top-4
                right-4
                z-50
                w-10
                h-10
                rounded-full
                bg-black/60
                backdrop-blur-md
                border
                border-white/10
                text-white
                flex
                items-center
                justify-center
                hover:bg-black/80
              "
            >
              ✕
            </button>


            <div className={`
              flex
              items-center
              justify-center
              gap-5
              w-full
              max-w-[1050px]
              h-full
              px-4

              ${
                isCommentsOpen
                  ? 'mr-[420px]'
                  : ''
              }
            `}>


              {/* MEDIA */}

              <div className="
                relative
                w-full
                max-w-[650px]
                aspect-square
                max-h-[85vh]
                bg-black
                rounded-[24px]
                overflow-hidden
                shadow-2xl
                shrink-0
              ">

                {/* MUTE */}

                <button
                  onClick={
                    toggleMute
                  }
                  className="
                    absolute
                    top-4
                    left-4
                    z-40
                    w-10
                    h-10
                    rounded-full
                    bg-black/60
                    backdrop-blur-md
                    border
                    border-white/10
                    text-white
                  "
                >
                  {isMuted
                    ? '🔇'
                    : '🔊'}
                </button>


                {/* MENU */}

                {isOwnProfile && (

                  <div className="
                    absolute
                    top-4
                    right-4
                    z-40
                  ">

                    <button
                      onClick={() =>
                        setIsEditModalOpen(
                          true
                        )
                      }
                      className="
                        w-10
                        h-10
                        rounded-full
                        bg-black/60
                        backdrop-blur-md
                        border
                        border-white/10
                        text-white
                      "
                    >
                      ⋮
                    </button>

                  </div>

                )}


                {/* MEDIA */}

                <div
                  onClick={
                    handleVideoClick
                  }
                  className="
                    w-full
                    h-full
                    relative
                    cursor-pointer
                  "
                >

                  {viewerPost.mediaUrl ? (

                    viewerPost.mediaType ===
                    'video' ? (

                      <video
                        ref={
                          videoRef
                        }
                        src={
                          getMediaUrl(
                            viewerPost.mediaUrl
                          )
                        }
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
                        src={
                          getMediaUrl(
                            viewerPost.mediaUrl
                          )
                        }
                        alt="Post"
                        className="
                          w-full
                          h-full
                          object-cover
                        "
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
                      text-white/40
                      text-3xl
                      font-bold
                      text-center
                      p-6
                    ">
                      {viewerPost.content}
                    </div>

                  )}


                  {/* GRADIENT */}

                  <div className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-[45%]
                    bg-gradient-to-t
                    from-black/90
                    via-black/30
                    to-transparent
                    pointer-events-none
                  " />


                  {/* AUTHOR */}

                  <div className="
                    absolute
                    left-4
                    right-4
                    bottom-6
                    z-20
                  ">

                    <Link
                      to={`/profile/${viewerPost.user?._id}`}
                      className="
                        flex
                        items-center
                        gap-3
                        mb-2
                        w-fit
                      "
                    >

                      <div className="
                        w-9
                        h-9
                        rounded-full
                        bg-accent
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                        font-bold
                      ">

                        {viewerPost.user?.avatar ? (

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
                          />

                        ) : (

                          viewerPost.user?.username
                            ?.charAt(0)
                            .toUpperCase()

                        )}

                      </div>


                      <span className="
                        font-bold
                        text-white
                      ">
                        @{viewerPost.user?.username}

                        {viewerPost.user?.isVerified && (

                          <span className="
                            text-blue-500
                            ml-1
                          ">
                            ✓
                          </span>

                        )}

                      </span>

                    </Link>


                    <p className="
                      text-white/90
                      text-sm
                      leading-relaxed
                      max-w-[80%]
                    ">
                      {viewerPost.content}
                    </p>

                  </div>


                  {/* PROGRESS */}

                  <div className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-1
                    bg-white/20
                    z-30
                  ">

                    <div
                      className="
                        h-full
                        bg-white
                      "
                      style={{
                        width:
                          `${progress}%`
                      }}
                    />

                  </div>


                  {!isPlaying &&
                    viewerPost.mediaType ===
                      'video' && (

                    <div className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      pointer-events-none
                    ">

                      <div className="
                        w-16
                        h-16
                        rounded-full
                        bg-black/60
                        backdrop-blur-md
                        flex
                        items-center
                        justify-center
                      ">

                        <FaPlay
                          size={23}
                          className="
                            ml-1
                          "
                        />

                      </div>

                    </div>

                  )}

                </div>

              </div>


              {/* =================================================
                  ACTIONS
              ================================================== */}

              <div className="
                flex
                flex-col
                items-center
                gap-4
                shrink-0
              ">


                {/* AUTHOR */}

                <Link
                  to={`/profile/${viewerPost.user?._id}`}
                  className="
                    w-12
                    h-12
                    rounded-full
                    overflow-hidden
                    border-2
                    border-white/20
                    bg-gray-700
                    flex
                    items-center
                    justify-center
                  "
                >

                  {viewerPost.user?.avatar ? (

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
                    />

                  ) : (

                    <span className="
                      text-white
                      font-bold
                    ">
                      {viewerPost.user?.username
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>

                  )}

                </Link>


                {/* LIKE */}

                <button
                  onClick={() =>
                    handleLike(
                      viewerPost._id
                    )
                  }
                  className="
                    flex
                    flex-col
                    items-center
                    gap-1
                  "
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
                    text-white/70
                    text-[11px]
                  ">
                    {viewerPost.likes?.length ||
                      0}
                  </span>

                </button>


                {/* COMMENT */}

                <button
                  onClick={() =>
                    setIsCommentsOpen(
                      prev =>
                        !prev
                    )
                  }
                  className="
                    flex
                    flex-col
                    items-center
                    gap-1
                  "
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
                  ">

                    <FaComment className="
                      text-white/80
                      text-xl
                    " />

                  </div>


                  <span className="
                    text-white/70
                    text-[11px]
                  ">
                    {viewerPost.comments?.length ||
                      0}
                  </span>

                </button>


                {/* SAVE */}

                <button
                  onClick={() =>
                    handleSave(
                      viewerPost._id
                    )
                  }
                  className="
                    flex
                    flex-col
                    items-center
                    gap-1
                  "
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
                    text-white/70
                    text-[11px]
                  ">
                    {viewerPost.savedBy?.length ||
                      0}
                  </span>

                </button>


                {/* SHARE */}

                <button
                  onClick={() =>
                    handleShare(
                      viewerPost
                    )
                  }
                  className="
                    flex
                    flex-col
                    items-center
                    gap-1
                  "
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

                    <FaShare className="
                      text-white/80
                      text-xl
                    " />

                  </div>

                </button>


                {/* NAVIGATION */}

                <div className="
                  border-t
                  border-white/10
                  pt-4
                  mt-2
                  flex
                  flex-col
                  gap-3
                ">

                  <button
                    onClick={
                      goPrev
                    }
                    disabled={
                      viewerIndex ===
                      0
                    }
                    className="
                      w-10
                      h-10
                      rounded-full
                      bg-black/60
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      disabled:opacity-30
                    "
                  >
                    <FaChevronUp />
                  </button>


                  <button
                    onClick={
                      goNext
                    }
                    disabled={
                      viewerIndex ===
                      viewerPosts.length - 1
                    }
                    className="
                      w-10
                      h-10
                      rounded-full
                      bg-black/60
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      disabled:opacity-30
                    "
                  >
                    <FaChevronDown />
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
                    x:
                      '100%'
                  }}
                  animate={{
                    x:
                      0
                  }}
                  exit={{
                    x:
                      '100%'
                  }}
                  transition={{
                    duration:
                      0.3
                  }}
                  className="
                    absolute
                    top-0
                    right-0
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
                  "
                >

                  <div className="
                    flex
                    justify-between
                    items-center
                    pb-4
                    border-b
                    border-white/10
                  ">

                    <h3 className="
                      text-white
                      font-bold
                      text-lg
                    ">
                      Комментарии
                    </h3>


                    <button
                      onClick={() =>
                        setIsCommentsOpen(
                          false
                        )
                      }
                      className="
                        text-white/50
                        hover:text-white
                        text-xl
                      "
                    >
                      ✕
                    </button>

                  </div>


                  <div className="
                    flex-1
                    overflow-y-auto
                    py-5
                    space-y-5
                  ">

                    {viewerPost.comments?.length ===
                      0 && (

                      <p className="
                        text-white/40
                        text-center
                        mt-10
                      ">
                        Нет комментариев
                      </p>

                    )}


                    {viewerPost.comments?.map(
                      comment => {

                        const isAuthor =
                          sameId(
                            currentUser?._id,
                            comment.user?._id
                          );


                        const liked =
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
                            ">

                              <Link
                                to={`/profile/${comment.user?._id}`}
                              >
                                <div className="
                                  w-8
                                  h-8
                                  rounded-full
                                  bg-gray-700
                                  overflow-hidden
                                  flex
                                  items-center
                                  justify-center
                                  text-xs
                                  font-bold
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
                                    />

                                  ) : (

                                    comment.user?.username
                                      ?.charAt(0)
                                      .toUpperCase()

                                  )}

                                </div>
                              </Link>


                              <div className="
                                flex-1
                              ">

                                <Link
                                  to={`/profile/${comment.user?._id}`}
                                  className="
                                    text-white/60
                                    text-xs
                                  "
                                >
                                  @{comment.user?.username}
                                </Link>


                                {editingCommentId ===
                                comment._id ? (

                                  <div className="
                                    mt-2
                                  ">

                                    <textarea
                                      value={
                                        editCommentText
                                      }
                                      onChange={e =>
                                        setEditCommentText(
                                          e.target.value
                                        )
                                      }
                                      className="
                                        w-full
                                        bg-white/5
                                        border
                                        border-white/10
                                        rounded-lg
                                        p-2
                                        text-white
                                        text-sm
                                        resize-none
                                      "
                                      rows="2"
                                    />


                                    <div className="
                                      flex
                                      gap-3
                                      mt-2
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
                                          text-white/40
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
                              ml-11
                              mt-2
                              flex
                              items-center
                              gap-4
                            ">

                              <button
                                onClick={() =>
                                  handleCommentLike(
                                    viewerPost._id,
                                    comment._id
                                  )
                                }
                                className={`
                                  flex
                                  items-center
                                  gap-1
                                  ${
                                    liked
                                      ? 'text-red-500'
                                      : 'text-white/40'
                                  }
                                `}
                              >

                                {liked
                                  ? <FaHeart />
                                  : <FaRegHeart />}

                                <span className="
                                  text-xs
                                ">
                                  {comment.likes?.length ||
                                    ''}
                                </span>

                              </button>


                              <button
                                onClick={() =>
                                  document
                                    .getElementById(
                                      `reply-input-${comment._id}`
                                    )
                                    ?.focus()
                                }
                                className="
                                  flex
                                  items-center
                                  gap-1
                                  text-white/40
                                  hover:text-white
                                  text-xs
                                "
                              >

                                <FaReply
                                  size={12}
                                />

                                Ответить

                              </button>


                              {isAuthor && (

                                <div className="
                                  ml-auto
                                  flex
                                  gap-2
                                  text-white/30
                                ">

                                  <button
                                    onClick={() =>
                                      startEditComment(
                                        comment._id,
                                        comment.text
                                      )
                                    }
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
                                    "
                                  >
                                    <FaTrash
                                      size={12}
                                    />
                                  </button>

                                </div>

                              )}

                            </div>


                            {/* REPLY INPUT */}

                            <div className="
                              ml-11
                              mt-3
                              flex
                              gap-2
                            ">

                              <input
                                id={`reply-input-${comment._id}`}
                                value={
                                  replyTexts[
                                    comment._id
                                  ] || ''
                                }
                                onChange={e =>
                                  setReplyTexts(
                                    prev => ({

                                      ...prev,

                                      [comment._id]:
                                        e.target.value

                                    })
                                  )
                                }
                                onKeyDown={e => {

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
                                placeholder="Написать ответ..."
                                className="
                                  flex-1
                                  bg-transparent
                                  border-b
                                  border-white/10
                                  text-white
                                  text-xs
                                  outline-none
                                  pb-1
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
                                "
                              >
                                Отправить
                              </button>

                            </div>


                            {/* REPLIES */}

                            {comment.replies?.length >
                              0 && (

                              <div className="
                                ml-11
                                mt-4
                                border-l
                                border-white/10
                                pl-3
                                space-y-3
                              ">

                                {comment.replies.map(
                                  reply => {

                                    const isReplyAuthor =
                                      sameId(
                                        currentUser?._id,
                                        reply.user?._id
                                      );


                                    const isEditing =
                                      editingCommentId ===
                                      reply._id;


                                    return (

                                      <div
                                        key={
                                          reply._id
                                        }
                                        className="
                                          flex
                                          gap-2
                                        "
                                      >

                                        <div className="
                                          w-6
                                          h-6
                                          rounded-full
                                          bg-gray-700
                                          overflow-hidden
                                          shrink-0
                                          flex
                                          items-center
                                          justify-center
                                          text-[9px]
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
                                            />

                                          ) : (

                                            reply.user?.username
                                              ?.charAt(0)
                                              .toUpperCase()

                                          )}

                                        </div>


                                        <div className="
                                          flex-1
                                        ">

                                          <div className="
                                            text-white/40
                                            text-[11px]
                                          ">
                                            @{reply.user?.username}
                                          </div>


                                          {isEditing ? (

                                            <div className="
                                              mt-1
                                            ">

                                              <textarea
                                                value={
                                                  editCommentText
                                                }
                                                onChange={e =>
                                                  setEditCommentText(
                                                    e.target.value
                                                  )
                                                }
                                                className="
                                                  w-full
                                                  bg-white/5
                                                  border
                                                  border-white/10
                                                  rounded-lg
                                                  p-2
                                                  text-white
                                                  text-xs
                                                  resize-none
                                                "
                                                rows="2"
                                              />


                                              <div className="
                                                flex
                                                gap-2
                                                mt-2
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
                                                    text-white/40
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
                                            ">
                                              {reply.text}
                                            </p>

                                          )}


                                          {isReplyAuthor &&
                                            !isEditing && (

                                            <div className="
                                              flex
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


                  {/* INPUT */}

                  <div className="
                    pt-4
                    border-t
                    border-white/10
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
                    ">

                      <input
                        value={
                          commentText
                        }
                        onChange={e =>
                          setCommentText(
                            e.target.value
                          )
                        }
                        onKeyDown={e => {

                          if (
                            e.key ===
                            'Enter'
                          ) {

                            handleAddComment(
                              viewerPost._id
                            );

                          }

                        }}
                        placeholder="Добавить комментарий..."
                        className="
                          flex-1
                          bg-transparent
                          text-white
                          text-sm
                          outline-none
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
                          text-sm
                        "
                      >
                        Опубликовать
                      </button>

                    </div>

                  </div>

                </motion.div>

              )}

            </AnimatePresence>

          </motion.div>

        )}

      </AnimatePresence>


      {/* =====================================================
          EDIT POST MODAL
      ====================================================== */}

      <AnimatePresence>

        {isEditModalOpen && (

          <motion.div
            initial={{
              opacity:
                0
            }}
            animate={{
              opacity:
                1
            }}
            exit={{
              opacity:
                0
            }}
            onClick={() =>
              setIsEditModalOpen(
                false
              )
            }
            className="
              fixed
              inset-0
              z-[10000]
              bg-black/80
              backdrop-blur-md
              flex
              items-center
              justify-center
              p-4
            "
          >

            <motion.div
              initial={{
                scale:
                  0.95,
                y:
                  20
              }}
              animate={{
                scale:
                  1,
                y:
                  0
              }}
              exit={{
                scale:
                  0.95,
                y:
                  20
              }}
              onClick={e =>
                e.stopPropagation()
              }
              className="
                w-full
                max-w-md
                bg-[#0a0a0a]
                border
                border-white/10
                rounded-2xl
                p-6
                shadow-2xl
              "
            >

              <h3 className="
                text-xl
                font-bold
                mb-4
              ">
                Редактировать пост
              </h3>


              <textarea
                value={
                  editContent
                }
                onChange={e =>
                  setEditContent(
                    e.target.value
                  )
                }
                className="
                  w-full
                  min-h-[120px]
                  bg-white/5
                  border
                  border-white/10
                  rounded-xl
                  p-3
                  text-white
                  outline-none
                  resize-none
                "
              />


              {editPreview && (

                <div className="
                  relative
                  mt-4
                  rounded-xl
                  overflow-hidden
                  border
                  border-white/10
                ">

                  {editFile?.type?.startsWith(
                    'video/'
                  ) ? (

                    <video
                      src={
                        editPreview
                      }
                      controls
                      className="
                        w-full
                        max-h-60
                        object-contain
                        bg-black
                      "
                    />

                  ) : (

                    <img
                      src={
                        editPreview
                      }
                      alt="Preview"
                      className="
                        w-full
                        max-h-60
                        object-contain
                        bg-black
                      "
                    />

                  )}

                </div>

              )}


              <button
                type="button"
                onClick={() =>
                  editFileInputRef.current?.click()
                }
                className="
                  w-full
                  mt-4
                  py-2.5
                  rounded-xl
                  bg-white/10
                  hover:bg-white/15
                  transition
                "
              >
                Добавить / заменить медиа
              </button>


              <input
                ref={
                  editFileInputRef
                }
                type="file"
                accept="image/*,video/*"
                onChange={
                  handleEditFile
                }
                className="hidden"
              />


              <div className="
                flex
                gap-3
                mt-5
              ">

                <button
                  onClick={() =>
                    setIsEditModalOpen(
                      false
                    )
                  }
                  className="
                    flex-1
                    py-2.5
                    rounded-xl
                    bg-white/10
                    hover:bg-white/15
                  "
                >
                  Отмена
                </button>


                <button
                  onClick={
                    handleUpdatePost
                  }
                  disabled={
                    isUpdating
                  }
                  className="
                    flex-1
                    py-2.5
                    rounded-xl
                    bg-accent
                    hover:bg-accent/80
                    disabled:opacity-50
                  "
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